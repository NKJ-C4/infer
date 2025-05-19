import yaml
import json
from langchain_aws import BedrockLLM
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.chat_models.bedrock import BedrockChat
from langchain.chains import LLMChain
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from typing import Optional
from src.call_snowflake import get_data
from typing import List, Dict
from src.render_graph import render_graph

with open("/home/nishantkumar.jha/projects/experiments/phaser/backend/src/semantic.yml", "r") as file:
        semantic = yaml.safe_load(file)

def truncate_data(data, max_length=1000):
    data_str = json.dumps(data)
    return data_str[:max_length] + "..." if len(data_str) > max_length else data_str

def output_analyser(sql_result , sql_query , user_query):


    # Step 1: Define the semantic schema used in output parser
    ana_response_schemas = [
            ResponseSchema(
                name="analysis",
                description="The actual data analysis result based on the user query and provided data."
            ),
            ResponseSchema(
                name="visualization_recommended",
                description="A boolean (true/false) indicating whether the data is suitable for visualization with a graphing library like Plotly."
            ),
            ResponseSchema(
                name="visualization_type",
                description="If visualization_recommended is true, recommend a specific chart type (e.g., 'bar', 'line', 'scatter', 'pie', 'heatmap', 'candlesticks''none'). If visualization_recommended is false, return 'none'."
            ),
            ResponseSchema(
                name="visualization_config",
                description="If visualization_recommended is true, provide a JSON object with basic configuration for the recommended chart type including x_axis, y_axis, and title. If visualization_recommended is false, return an empty object {}."
            )
        ]
    # Step 2: Initialize the output parser
    analysis_parser = StructuredOutputParser.from_response_schemas(ana_response_schemas)
    ana_format_instructions = analysis_parser.get_format_instructions()


    analysis_template = """You are an AI trained to analyze structured data.
    DB SCHEMA: {semantic}

    User Query: {user_query}

    Data for Analysis:
    {data}

    If the data contains a summary (e.g., sample rows, shape, or columns), use it to infer insights. Generate an insightful analysis that accurately satisfies the user query. Keep the response clear, concise, and **limited to a maximum of 200 words**.
    
    Additionally, determine if the data is suitable for visualization:
    1. If the data contains numerical values that can be plotted (e.g., trends, comparisons, distributions), set visualization_recommended to true.
    2. If visualization is recommended and is not VERY heavy to be rendered using a prebuilt template by an LLM, suggest an appropriate chart type (bar, line, scatter, pie, heatmap, etc.)
    3. For the visualization_config, specify which columns should be used for x_axis and y_axis, and suggest an appropriate title.
    4. If the data is not suitable for visualization (e.g., just text or a single value), set visualization_recommended to false.
        
    Use this format:
    {ana_format_instructions}
    """
    # Initialize prompt template
    analysis_prompt = PromptTemplate(input_variables=["user_query", "data"], template=analysis_template, partial_variables={"ana_format_instructions": ana_format_instructions, "semantic": semantic},)
    llm = BedrockChat(
            model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",  
            model_kwargs={
                "temperature": 0.4,
                "max_tokens": 2000,  
                "top_p": 0.7,
            },
            region_name="us-east-1"  # Changed from "region" to "region_name"
        )

    analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt)
    if sql_result.shape[0] <= 100:
        dict_sql_result = sql_result.to_dict()
        analysis_output = analysis_chain.run(user_query=user_query, data=dict_sql_result)
        analysis_parsed_output = analysis_parser.parse(analysis_output)
        visualization_data = {
            "visualization_recommended": analysis_parsed_output.get("visualization_recommended", False),
            "visualization_type": analysis_parsed_output.get("visualization_type", "none"),
            "visualization_config": analysis_parsed_output.get("visualization_config", {})
        }
        if analysis_parsed_output.get('visualization_recommended') == True:
            graph_plots = render_graph(sql_result, visualization_data)
            print("Graph plot type and graph plot: ", type(graph_plots), " ", graph_plots)
            analysis_parsed_output["graph_plots"] = graph_plots
        return analysis_parsed_output
    else:
        dict_sql_result = {
            "sample_rows": sql_result.head(10).to_dict(orient="records"),
            "data_shape": sql_result.shape,
            "columns": sql_result.columns.tolist()
        }
        truncated_data = truncate_data(dict_sql_result)
        try:
            analysis_output = analysis_chain.run(user_query=user_query, data=truncated_data)
            ana_parsed_output = analysis_parser.parse(analysis_output)
            visualization_data = {
                "visualization_recommended": ana_parsed_output.get("visualization_recommended", False),
                "visualization_type": ana_parsed_output.get("visualization_type", "none"),
                "visualization_config": ana_parsed_output.get("visualization_config", {})
            }
            if ana_parsed_output.get('visualization_recommended') == True:
                graph_plots = render_graph(truncated_data, visualization_data)
                print("Graph plot type and graph plot: ", type(graph_plots), " ", graph_plots)
                ana_parsed_output["graph_plots"] = graph_plots

            return ana_parsed_output
        except Exception as e:
            print("Error in analysis chain: ", e)
            ana_parsed_output = {
                "analysis": "Unable to generate analysis due to an error."
            }
            return ana_parsed_output