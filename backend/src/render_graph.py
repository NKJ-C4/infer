import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import json
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chat_models import BedrockChat

def render_graph(parsed_raw_data, visualization_info):
    """
    Generate a matplotlib/pandas visualization based on the data and visualization info.
    Returns a base64 encoded image that can be directly embedded in HTML/frontend.
    """
    # If we have actual DataFrame data (not just metadata)
    if isinstance(parsed_raw_data, pd.DataFrame):
        df = parsed_raw_data
    else:
        # Try to convert sample data to DataFrame if available
        try:
            if 'sample_rows' in parsed_raw_data:
                df = pd.DataFrame(parsed_raw_data['sample_rows'])
            else:
                # Handle case where we only have dictionary data
                df = pd.DataFrame(parsed_raw_data)
        except Exception as e:
            print(f"Error converting data to DataFrame: {e}")
            return {"image": None, "error": "Could not convert data to DataFrame"}
    
    try:
        # Extract visualization parameters
        viz_type = visualization_info.get('visualization_type', 'bar')
        viz_config = visualization_info.get('visualization_config', {})
        
        x_column = viz_config.get('x_axis')
        y_column = viz_config.get('y_axis')
        title = viz_config.get('title', 'Data Visualization')
        
        # Create figure and axis objects
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Generate the appropriate plot based on visualization type
        if viz_type == 'bar':
            if x_column and y_column:
                df.plot(kind='bar', x=x_column, y=y_column, ax=ax)
            else:
                # Fall back to simple bar chart of first two columns
                df.iloc[:, :2].plot(kind='bar', ax=ax)
                
        elif viz_type == 'line':
            if x_column and y_column:
                df.plot(kind='line', x=x_column, y=y_column, ax=ax)
            else:
                df.iloc[:, :2].plot(kind='line', ax=ax)
                
        elif viz_type == 'scatter':
            if x_column and y_column:
                df.plot(kind='scatter', x=x_column, y=y_column, ax=ax)
            else:
                # Try to find two numeric columns
                numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
                if len(numeric_cols) >= 2:
                    df.plot(kind='scatter', x=numeric_cols[0], y=numeric_cols[1], ax=ax)
                else:
                    df.iloc[:, :2].plot(kind='scatter', ax=ax)
                    
        elif viz_type == 'pie':
            if x_column and y_column:
                df.plot(kind='pie', y=y_column, labels=df[x_column], ax=ax)
            else:
                # Use the first column as labels and second as values
                df.iloc[:, 1].plot(kind='pie', labels=df.iloc[:, 0], ax=ax)
                
        elif viz_type == 'heatmap':
            # For heatmap we need matrix-like data
            pivot_columns = viz_config.get('pivot_columns', [])
            if len(pivot_columns) >= 3:  # We need row, col, and value columns
                pivot_df = df.pivot(
                    index=pivot_columns[0],
                    columns=pivot_columns[1], 
                    values=pivot_columns[2]
                )
                sns.heatmap(pivot_df, annot=True, ax=ax)
            else:
                # Try correlation matrix as fallback for heatmap
                numeric_df = df.select_dtypes(include=['number'])
                if not numeric_df.empty:
                    sns.heatmap(numeric_df.corr(), annot=True, ax=ax)
                else:
                    df.iloc[:, :5].plot(kind='bar', ax=ax)  # Fallback
        
        else:  # Default plot if type not recognized
            df.plot(kind='bar', ax=ax)
        
        # Add title and labels using the axis object
        ax.set_title(title)
        if x_column:
            ax.set_xlabel(x_column)
        if y_column:
            ax.set_ylabel(y_column)
            
        # Rotate x-axis labels if there are many categories
        ax.tick_params(axis='x', rotation=45)
        
        # Tight layout to ensure all elements are visible
        fig.tight_layout()
        
        # Save plot to a bytes buffer
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        
        # Convert to base64 encoded string for HTML embedding
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)  # Close plot to free memory
        
        # Return base64 encoded image ready for HTML embedding
        return {
            "image": img_str,
            "image_type": "png",
            "html_tag": f'<img src="data:image/png;base64,{img_str}" alt="{title}" />'
        }
        
    except Exception as e:
        print(f"Error generating visualization: {e}")
        # If we encounter an error during visualization, try an AI-assisted approach
        return generate_fallback_visualization(df, visualization_info)


def generate_fallback_visualization(df, visualization_info):
    """
    Fallback method that uses LLM to generate matplotlib code for visualization
    when the automatic methods fail.
    """
    prompt_template = """You are a data visualization expert. Given this dataset:
    
    Column names: {column_names}
    Data types: {data_types}
    Sample data: {sample_data}
    
    And this visualization request:
    {visualization_info}
    
    Generate Python code using matplotlib, seaborn, or pandas plotting that will create an appropriate
    visualization. The code should:
    
    1. Work with the given dataframe (named 'df')
    2. Use fig, ax = plt.subplots() for proper axis object handling
    3. Create a clear and informative visualization
    4. Include proper titles, labels, and formatting
    5. Return just the executable matplotlib/pandas/seaborn code, nothing else
    
    {format_instructions}
    """
    
    response_schemas = [
        ResponseSchema(
            name="visualization_code",
            description="Python code using matplotlib/pandas/seaborn that creates the visualization"
        )
    ]
    
    llm = BedrockChat(
        model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",  
        model_kwargs={
            "temperature": 0.4,
            "max_tokens": 2000,  
            "top_p": 0.7,
        },
        region_name="us-east-1"
    )
    
    try:
        # Prepare sample data for the prompt
        sample_data = df.head(5).to_dict(orient='records')
        column_names = df.columns.tolist()
        data_types = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        
        # Format the visualization info
        viz_info_str = json.dumps(visualization_info, indent=2)
        
        # Setup parser
        parser = StructuredOutputParser.from_response_schemas(response_schemas)
        format_instructions = parser.get_format_instructions()
        
        # Create prompt
        analysis_prompt = PromptTemplate(
            input_variables=["column_names", "data_types", "sample_data", "visualization_info"],
            template=prompt_template,
            partial_variables={"format_instructions": format_instructions}
        )
        
        # Create and run the chain
        analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt)
        response = analysis_chain.run(
            column_names=json.dumps(column_names),
            data_types=json.dumps(data_types),
            sample_data=json.dumps(sample_data),
            visualization_info=viz_info_str
        )
        
        # Parse the response to get the code
        parsed_response = parser.parse(response)
        code = parsed_response.get("visualization_code", "")
        
        if code:
            # Execute the generated code in a controlled environment
            local_vars = {"df": df, "plt": plt, "sns": sns, "pd": pd}
            
            # Add fig and ax variables to the local environment
            fig, ax = plt.subplots(figsize=(10, 6))
            local_vars["fig"] = fig
            local_vars["ax"] = ax
            
            exec(code, globals(), local_vars)
            
            # Make sure we use the figure from local_vars in case it was modified
            fig = local_vars.get("fig", fig)
            
            # Save the resulting plot to a bytes buffer
            buf = io.BytesIO()
            fig.savefig(buf, format='png')
            buf.seek(0)
            
            # Convert to base64 encoded string
            img_str = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
            
            return {
                "image": img_str,
                "image_type": "png",
                "html_tag": f'<img src="data:image/png;base64,{img_str}" alt="AI Generated Visualization" />'
            }
        
    except Exception as e:
        print(f"Error in AI-assisted visualization generation: {e}")
    
    # If all else fails, return a simple text message
    return {
        "image": None,
        "error": "Failed to generate visualization"
    }