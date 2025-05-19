"""
LangChain with AWS Bedrock Integration Example
This script shows how to use LangChain with AWS Bedrock LLMs and OutputParser for SQL generation.
Requirements:
pip install langchain langchain-aws boto3 pydantic
"""
import os
import json
import yaml
from langchain_aws import BedrockLLM
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.chat_models.bedrock import BedrockChat
from langchain.chains import LLMChain
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from typing import Optional
from src.call_snowflake import get_data
from typing import List, Dict
from src.output_analysis import output_analyser

with open("/home/nishantkumar.jha/projects/experiments/phaser/backend/src/semantic.yml", "r") as file:
        semantic = yaml.safe_load(file)


def text_to_sql_and_result(query: str, chat_history: List[Dict[str, str]] = None):
    """
    Process user query to generate SQL or conversational responses, with chat history context.
    
    Args:
        query (str): The user's current query
        chat_history (List[Dict[str, str]], optional): List of previous messages with 'role' and 'content'
    
    Returns:
        dict: Response containing response_type and appropriate content
    """
    # Initialize chat history if None
    if chat_history is None:
        chat_history = []
    
    # Create memory for LLM context
    memory = ConversationBufferMemory()
    
    # Process recent history (last 4 messages to avoid token limits)
    recent_history = chat_history[-4:] if chat_history else []
    
    # Add messages to memory
    for msg in recent_history:
        role = msg.get('role', '').lower()
        content = msg.get('content', '')
        
        if content:  # Skip empty messages
            if role == 'user':
                memory.chat_memory.add_user_message(content)
            elif role == 'assistant':
                memory.chat_memory.add_ai_message(content)
    
    # Format history for prompt
    history_text = ""
    for msg in recent_history:
        role = msg.get('role', '').upper()
        content = msg.get('content', '')
        if role and content:
            history_text += f"{role}: {content}\n\n"

    # Define response schemas
    response_schemas = [
        ResponseSchema(
            name="response_type",
            description="A string indicating the type of response: 'sql' for SQL queries, 'conversation' for normal chat, or 'unauthorized' for inappropriate questions"
        ),
        ResponseSchema(
            name="content",
            description="The actual response content - either SQL query or conversational text depending on response_type"
        ),
        ResponseSchema(
            name="explanation",
            description="For SQL queries: brief explanation of what the query does. For conversation: empty string. For unauthorized: empty string."
        )
    ]
    
    # Initialize the output parser
    parser = StructuredOutputParser.from_response_schemas(response_schemas)
    format_instructions = parser.get_format_instructions()


    # print("format instr: ", ana_format_instructions)
    # Initialize the Bedrock LLM
    llm = BedrockChat(
            model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",  
            model_kwargs={
                "temperature": 0.4,
                "max_tokens": 2000,  
                "top_p": 0.7,
            },
            region_name="us-east-1"  # Changed from "region" to "region_name"
        )

    prompt = PromptTemplate(
        input_variables=["user_input", "history"],
        template="""You are an advanced AI assistant specialized in Snowflake SQL generation and data analysis. You help users query a retail database.

        DATABASE SCHEMA:
        "the db schema is as follows:\n{semantic}"

        CONVERSATION HISTORY(it may help you understand the previous context, if in current user input there is no cotext to history, you can ignore it):
        {history}
        
        CURRENT USER INPUT:
        "{user_input}"

        ## RESPONSE GUIDELINES

        Analyze the user's input and respond according to these rules:

        1. If the input is related to data analysis or SQL queries for the retail database:
        - Set response_type to "sql"
        - Generate a correct, optimized Snowflake SQL query in the content field
        - Explain what the query does in the explanation field
        - Use proper Snowflake SQL syntax with appropriate joins, filters, and aggregations if needed

        2. If the input is a normal conversational question (like greetings, basic math, basic general knowledge):
        - Set response_type to "conversation"
        - Provide a friendly, helpful response in the content field
        - Leave explanation as an empty string

        3. If the input contains inappropriate content, requests for harmful information, or is clearly unethical:
        - Set response_type to "unauthorized"
        - Set content to "I am not authorized to answer this question."
        - Leave explanation as an empty string

        4. For harmful SQL queries that can modify the database (DELETE, ALTER, UPDATE, etc.):
        - Set response_type to "unauthorized"
        - Set content to "I am not authorized to perform this question."
        - Leave explanation as an empty string

        ## SQL BEST PRACTICES (When generating SQL):
        - Use clear table aliases (e.g., f for Features, s for Sales)
        - Format dates consistently using standard Snowflake SQL functions
        - Use explicit JOINs rather than implicit joins in WHERE clauses
        - Include relevant WHERE clauses to filter data appropriately
        - Format your Snowflake SQL query with proper indentation for readability
        - Consider previous questions in the conversation history for context if needed

        Now analyze the user input and respond in the requested format:

        {format_instructions}
        """,
        partial_variables={"format_instructions": format_instructions, "semantic": semantic},
    )

    # Create a chain
    chain = LLMChain(llm=llm, prompt=prompt)
    
    for i in range(5):
        if i == 4:
            return {
                "response_type": "error",
                "output": "I am unable to process your request at the moment. Please try again later."
            }
        
        # Run the chain with user input and chat history
        
        raw_output = chain.run(user_input=query, history=history_text)
        
        # Parse the output
        parsed_output = parser.parse(raw_output)
        
        # Handle conversational response
        if parsed_output['response_type'] == 'conversation' or parsed_output['response_type'] == 'unauthorized':
            return {
                "response_type": parsed_output['response_type'],
                "output": parsed_output['content']
            }
        
        # Handle SQL response
        elif parsed_output['response_type'] == 'sql':
            sql_query = parsed_output['content']
            # Execute SQL query and get results
            try:
                print("SQL Query:", sql_query)
                sql_result = get_data(sql_query)
                print("SQL Result:", type(sql_result))

                analysis_results = output_analyser(sql_result , sql_query , query )
                print("analysis results: ", analysis_results)
                return {
                    "response_type": "sql",
                    "sql_query": sql_query,
                    "explanation": parsed_output['explanation'],
                    "sql_result": sql_result,   
                    "analysis": analysis_results
                }
            except Exception as e:
                print("Error post final result is: ", e)
                history_text += "ai: " + sql_query + "\n\n" + "human: I am getting this error- " + str(e) + "Please fix this and give correct snowflake sql query.\n\n"
                continue
        
        # Fallback for unexpected response types
        else:
            return {
                "response_type": "error",
                "output": "Received an unexpected response type."
            }
                
            
if __name__ == "__main__":
    # Example usage
    user_query = "How many total stores are present in our retail business?"
    chat_history = []
    
    result = text_to_sql_and_result(user_query, chat_history)
    print(result)