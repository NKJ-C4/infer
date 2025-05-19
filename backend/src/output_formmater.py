"""
LangChain with AWS Bedrock Integration Example
This script shows how to use LangChain with AWS Bedrock LLMs and OutputParser for SQL generation,
with added visualization capabilities.
Requirements:
pip install langchain langchain-aws boto3 pydantic pandas matplotlib seaborn plotly
"""
import os
import json
import pandas as pd
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.io as pio
from langchain_aws import BedrockLLM
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import ResponseSchema, StructuredOutputParser
from typing import Optional, Dict, Any, List, Union
from src.call_snowflake import get_data

def detect_chart_type(df: pd.DataFrame, query: str) -> str:
    """
    Determine the most appropriate chart type based on data and query.
    
    Args:
        df: The DataFrame containing the query results
        query: The user's original text query
        
    Returns:
        String indicating the appropriate chart type
    """
    # Check for time series data
    date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
    
    # Check for numeric columns (potential metrics)
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    # Check for categorical columns
    categorical_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    
    # Keywords suggesting certain chart types
    trend_keywords = ['trend', 'over time', 'history', 'changes']
    comparison_keywords = ['compare', 'comparison', 'versus', 'vs']
    distribution_keywords = ['distribution', 'spread', 'frequency']
    
    # Check query intent
    if any(keyword in query.lower() for keyword in trend_keywords) and date_cols and numeric_cols:
        return 'line'
    elif any(keyword in query.lower() for keyword in comparison_keywords) and categorical_cols and numeric_cols:
        return 'bar'
    elif any(keyword in query.lower() for keyword in distribution_keywords) and numeric_cols:
        return 'histogram'
    elif 'correlation' in query.lower() and len(numeric_cols) >= 2:
        return 'scatter'
    elif df.shape[1] == 2 and len(numeric_cols) == 1 and len(categorical_cols) == 1:
        return 'pie'
    elif date_cols and numeric_cols:
        return 'line'
    elif categorical_cols and numeric_cols:
        return 'bar'
    elif len(numeric_cols) >= 2:
        return 'scatter'
    else:
        return 'table'  # Default to table if no clear visualization type

def create_visualization(df: pd.DataFrame, chart_type: str, query: str) -> Dict[str, Any]:
    """
    Create a visualization based on the data and chart type.
    
    Args:
        df: The DataFrame containing the query results
        chart_type: The type of chart to create
        query: The original user query
        
    Returns:
        Dictionary with base64 encoded image and HTML
    """
    result = {'chart_type': chart_type}
    
    if df.empty or df.shape[0] == 0:
        return {'chart_type': 'none', 'message': 'No data available for visualization'}
    
    # For matplotlib/seaborn charts
    plt.figure(figsize=(10, 6))
    
    try:
        if chart_type == 'line':
            # Identify date column and numeric columns
            date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
            if date_cols:
                x_col = date_cols[0]
                numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
                if numeric_cols:
                    # Create a Plotly line chart
                    fig = px.line(df, x=x_col, y=numeric_cols, title=f"Trend Analysis: {', '.join(numeric_cols)}")
                    result['plotly_html'] = pio.to_html(fig, full_html=False)
                    
                    # Create a Matplotlib version as fallback
                    for col in numeric_cols:
                        plt.plot(df[x_col], df[col], label=col)
                    plt.xlabel(x_col)
                    plt.ylabel('Value')
                    plt.title(f"Trend Analysis: {', '.join(numeric_cols)}")
                    plt.legend()
                    plt.xticks(rotation=45)
                    
        elif chart_type == 'bar':
            # Identify categorical column and numeric column
            categorical_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            
            if categorical_cols and numeric_cols:
                x_col = categorical_cols[0]
                y_col = numeric_cols[0]
                
                # Create a Plotly bar chart
                fig = px.bar(df, x=x_col, y=y_col, title=f"{y_col} by {x_col}")
                result['plotly_html'] = pio.to_html(fig, full_html=False)
                
                # Create a Matplotlib version as fallback
                sns.barplot(x=x_col, y=y_col, data=df)
                plt.xlabel(x_col)
                plt.ylabel(y_col)
                plt.title(f"{y_col} by {x_col}")
                plt.xticks(rotation=45)
                
        elif chart_type == 'histogram':
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            if numeric_cols:
                # Create a Plotly histogram
                fig = px.histogram(df, x=numeric_cols[0], title=f"Distribution of {numeric_cols[0]}")
                result['plotly_html'] = pio.to_html(fig, full_html=False)
                
                # Create a Matplotlib version as fallback
                sns.histplot(df[numeric_cols[0]])
                plt.xlabel(numeric_cols[0])
                plt.ylabel('Count')
                plt.title(f"Distribution of {numeric_cols[0]}")
                
        elif chart_type == 'scatter':
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            if len(numeric_cols) >= 2:
                # Create a Plotly scatter plot
                fig = px.scatter(df, x=numeric_cols[0], y=numeric_cols[1], 
                                 title=f"Relationship between {numeric_cols[0]} and {numeric_cols[1]}")
                result['plotly_html'] = pio.to_html(fig, full_html=False)
                
                # Create a Matplotlib version as fallback
                plt.scatter(df[numeric_cols[0]], df[numeric_cols[1]])
                plt.xlabel(numeric_cols[0])
                plt.ylabel(numeric_cols[1])
                plt.title(f"Relationship between {numeric_cols[0]} and {numeric_cols[1]}")
                
        elif chart_type == 'pie':
            categorical_col = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()[0]
            numeric_col = df.select_dtypes(include=['number']).columns.tolist()[0]
            
            # Create a Plotly pie chart
            fig = px.pie(df, names=categorical_col, values=numeric_col, title=f"{numeric_col} by {categorical_col}")
            result['plotly_html'] = pio.to_html(fig, full_html=False)
            
            # Create a Matplotlib version as fallback
            plt.pie(df[numeric_col], labels=df[categorical_col], autopct='%1.1f%%')
            plt.title(f"{numeric_col} by {categorical_col}")
            
        else:  # Default case or 'table'
            # For tables, we don't create a plot but return HTML representation
            result['chart_type'] = 'table'
            result['table_html'] = df.to_html(classes='table table-striped', index=False)
            
            # Create a simple visualization of the data structure
            plt.text(0.5, 0.5, f"Table with {df.shape[0]} rows and {df.shape[1]} columns", 
                    horizontalalignment='center', verticalalignment='center', fontsize=12)
            plt.axis('off')
            
        # Save matplotlib figure to base64
        if chart_type != 'table':
            buffer = BytesIO()
            plt.tight_layout()
            plt.savefig(buffer, format='png')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            result['image_base64'] = image_base64
            plt.close()
            
    except Exception as e:
        # If visualization fails, return the error and fallback to table
        result['chart_type'] = 'table'
        result['error'] = str(e)
        result['table_html'] = df.to_html(classes='table table-striped', index=False)
    
    return result

def generate_insights(df: pd.DataFrame, query: str, sql_query: str) -> List[str]:
    """
    Generate insights about the data based on the query results.
    
    Args:
        df: The DataFrame containing the query results
        query: The original user query
        sql_query: The SQL query used
        
    Returns:
        List of insight strings
    """
    insights = []
    
    if df.empty:
        return ["No data available to generate insights."]
    
    try:
        # Basic stats
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            for col in numeric_cols:
                insights.append(f"The average {col} is {df[col].mean():.2f}")
                insights.append(f"The maximum {col} is {df[col].max():.2f}")
                
                # Check for outliers
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                outliers = df[(df[col] < (q1 - 1.5 * iqr)) | (df[col] > (q3 + 1.5 * iqr))][col]
                if not outliers.empty:
                    insights.append(f"There are {len(outliers)} outliers in {col}")
        
        # Time-based insights
        date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
        if date_cols and numeric_cols:
            # This would need actual date parsing which depends on your date format
            insights.append("Time-based analysis would require converting the date columns to datetime format.")
        
        # Correlations
        if len(numeric_cols) >= 2:
            corr_matrix = df[numeric_cols].corr()
            high_corrs = [(i, j, corr_matrix.loc[i, j]) 
                        for i in corr_matrix.columns 
                        for j in corr_matrix.columns 
                        if i < j and abs(corr_matrix.loc[i, j]) > 0.7]
            
            for i, j, corr in high_corrs:
                corr_type = "positive" if corr > 0 else "negative"
                insights.append(f"There is a strong {corr_type} correlation ({corr:.2f}) between {i} and {j}")
        
        # Add general data summary
        insights.append(f"The dataset contains {df.shape[0]} records with {df.shape[1]} fields.")
        
    except Exception as e:
        insights.append(f"Error generating insights: {str(e)}")
    
    return insights[:5]  # Limit to top 5 insights

def text_to_sql_and_result(query, expected_output=None):
    """
    Convert text to SQL, run the SQL, and return visualization-ready results.
    
    Args:
        query: User's natural language query
        expected_output: Optional expected output format or specific requirements
        
    Returns:
        Dictionary containing SQL, data, visualizations, and insights
    """
    # Defining memory
    memory = ConversationBufferMemory()
    
    # Define the output schemas
    response_schemas = [
        ResponseSchema(name="sql_query", description="The generated SQL query that addresses the user's request"),
        ResponseSchema(name="explanation", description="A brief explanation of what the SQL query does")
    ]
    
    # Initialize the output parser
    parser = StructuredOutputParser.from_response_schemas(response_schemas)
    format_instructions = parser.get_format_instructions()
    
    # Initialize the Bedrock LLM
    llm = BedrockLLM(
        model_id="meta.llama3-1-70b-instruct-v1:0",  # Using Meta's Llama 3 70B model
        model_kwargs={
            "temperature": 0.3,
            "max_tokens": 800,  # Increased token limit for structured output
            "top_p": 0.6,
        },
        region="us-west-2"
    )
    
    # Create a prompt template with parser instructions
    prompt = PromptTemplate(
        input_variables=["topic"],
        template="""You are an advanced AI trained in SQL generation. Your task is to convert user statements into correct SQL queries when relevant.
        Table 1: Features
        This table tracks various economic and environmental factors that might affect retail sales.
        The Features table contains the following columns:
        CPI (Varchar): Consumer Price Index measurements that track inflation.
        DATE (Varchar): The date of the record, stored as text.
        FUEL_PRICE (Number): The price of fuel, stored as a numeric value.
        ISHOLIDAY (Boolean): A flag indicating whether the date is a holiday (true/false).
        MARKDOWN1 (Varchar): First markdown/discount event information.
        MARKDOWN2 (Varchar): Second markdown/discount event information.
        MARKDOWN3 (Varchar): Third markdown/discount event information.
        MARKDOWN4 (Varchar): Fourth markdown/discount event information.
        MARKDOWN5 (Varchar): Fifth markdown/discount event information.
        STORE (Number): Store identifier number.
        TEMPERATURE (Number): Temperature measurement, likely in the store location.
        UNEMPLOYMENT (Varchar): Unemployment rate information, stored as text.
        Table 2: Sales
        This table tracks weekly sales performance across different departments and stores.
        The Sales table contains the following columns:
        DATE (Varchar): The date of the sales record, stored as text.
        DEPT (Number): Department identifier number.
        ISHOLIDAY (Boolean): A flag indicating whether the date is a holiday (true/false).
        STORE (Number): Store identifier number.
        WEEKLY_SALES (Number): The weekly sales amount, stored as a numeric value.
        Table 3: Stores
        This table contains information about the individual store locations.
        The Stores table contains the following columns:
        SIZE (Number): The size of the store, likely in square feet.
        STORE (Number): Store identifier number.
        TYPE (Varchar): The type or format of the store, stored as text.
        The STORE column appears in all three tables and likely serves as a common key for joining the tables together in queries.
        **User Statement:** {topic}
        **Instructions:**
        - If the request is clearly related to database queries, generate a **correct and optimized SQL query**.
        - If the request is unclear or lacks enough detail to form a proper query, **ask the user for the missing information** before generating the SQL query.
        - If the request **is somewhat related to SQL or database queries**, try to interpret the user's intent and prompt them for clarification if needed.
        - If the request **is entirely unrelated to databases or SQL**, respond normally and engage with the user's query in an appropriate manner.
        - If you do not have an answer to the user's request, respond with: "Sorry, but I am not authorized to give you the answer."
        - When returning an SQL query, format it as: `"1, query"`
        - If responding in a general conversational manner, format the response as: `"0, response"`
        {format_instructions}
        """,
        partial_variables={"format_instructions": format_instructions}
    )
    
    # Create a chain
    chain = LLMChain(llm=llm, prompt=prompt, memory=memory)
    
    # Run the chain
    topic = query
    
    # Get the raw output from the chain
    raw_output = chain.run(topic)
    print("raw_output:", raw_output)
    
    # Parse the output manually
    try:
        parsed_output = parser.parse(raw_output)
        print("parsed_output:", parsed_output)
        
        # Get SQL query and explanation from parsed output
        sql_query = parsed_output.get('sql_query', '')
        explanation = parsed_output.get('explanation', '')
        
        # Check if we have a valid SQL query
        if sql_query.strip():
            # Get data from Snowflake
            try:
                df = get_data(sql_query)
                if isinstance(df, pd.DataFrame):
                    # Detect chart type
                    chart_type = detect_chart_type(df, query)
                    
                    # Create visualization
                    viz_data = create_visualization(df, chart_type, query)
                    
                    # Generate insights
                    insights = generate_insights(df, query, sql_query)
                    
                    # Prepare response
                    response = {
                        "status": "success",
                        "query": query,
                        "sql_query": sql_query,
                        "explanation": explanation,
                        "data": {
                            "records": df.to_dict('records'),
                            "columns": df.columns.tolist(),
                            "row_count": len(df)
                        },
                        "visualization": viz_data,
                        "insights": insights
                    }
                    
                    return response
                else:
                    # Handle case where get_data returns non-DataFrame
                    return {
                        "status": "error",
                        "message": "Data retrieval failed or returned in an unexpected format",
                        "query": query,
                        "sql_query": sql_query,
                        "explanation": explanation
                    }
            except Exception as e:
                # Handle data retrieval errors
                return {
                    "status": "error",
                    "message": f"Error retrieving data: {str(e)}",
                    "query": query,
                    "sql_query": sql_query,
                    "explanation": explanation
                }
        else:
            # Handle case where no SQL was generated
            return {
                "status": "error",
                "message": "No SQL query was generated. The request may not be related to database queries.",
                "query": query,
                "raw_response": raw_output
            }
    except Exception as e:
        # Handle parsing errors
        return {
            "status": "error",
            "message": f"Error parsing LLM output: {str(e)}",
            "query": query,
            "raw_output": raw_output
        }

# Example of how to use the function
if __name__ == "__main__":
    # Example query
    sample_query = "Show me weekly sales for each store type"
    
    # Call the function
    result = text_to_sql_and_result(sample_query)
    
    # Print the results
    print(json.dumps(result, indent=2))
