from fastapi import FastAPI , Request , UploadFile, File , Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
app = FastAPI()
import json
from src.bedrock import text_to_sql_and_result
from src.text_csv_results import text_csv_results
import pandas as pd
import io
from fastapi.responses import JSONResponse  
# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# Need to change the type of output['sql_result'] in string
@app.post("/get_user_data")
async def get_user_data(request: Request):
    data = await request.json()
    output = text_to_sql_and_result(data['query'], data['chat_history'])
    print("output", output)
    
    if output['response_type'] == 'conversation':
        return output
    
    print("Output is: ", output)
    
    # Convert DataFrame to different formats
    result_str = output['sql_result'].to_json(orient="records")
    
    # Create CSV string from DataFrame
    csv_string = output['sql_result'].to_csv(index=False)
    
    # Safely extract analysis and plot data with proper checks
    analysis_statement = ""
    analysis_plot = ""
    
    if output.get('analysis') and isinstance(output['analysis'], dict):
        # Get analysis text if available
        analysis_statement = output['analysis'].get('analysis', "")
        
        # Check if graph_plots exists and has image data
        if 'graph_plots' in output['analysis'] and isinstance(output['analysis']['graph_plots'], dict):
            graph_data = output['analysis']['graph_plots']
            if graph_data.get('image'):
                analysis_plot = graph_data
            elif graph_data.get('html_tag'):
                analysis_plot = graph_data.get('html_tag')
    style = """
    <style>
        table {csv_string
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #DEE2E6;
        }
    </style>
    """
    html_table = style + output['sql_result'].to_html(index=False, classes='table table-bordered')
    
    return {
        "response_type": output['response_type'],
        "result": result_str,
        "sql_query": output['sql_query'],
        'table': JSONResponse(content=html_table),
        'analysis_statement': analysis_statement,
        'analysis_plot': analysis_plot,
        'csv_data': csv_string  # Add CSV data to the response
    }




# Want to build an api which will recieve an csv file and then we willl convert it into a dataframe then will call the text_to_sql function which will give us the sql query and then i will run that query on the dataframe and return the result
@app.post("/get_csv_data")
async def get_csv_results(request: Request):
    form_data = await request.form()
    content_type = request.headers.get("Content-Type", "")
    df=""
    query=""
    chat_history=""
    if "multipart/form-data" in content_type:
        form_data = await request.form()
        
        # Get the file
        uploaded_file = form_data.get("file")
        
        # Get the JSON data
        json_data = json.loads(form_data.get("json_data"))
        query = json_data.get("query")
        chat_history = json_data.get("chat_history", [])
        # Process the uploaded CSV file
        if uploaded_file:
            # Read the file content
            contents = await uploaded_file.read()
            
            # Convert bytes to string
            csv_content = contents.decode("utf-8")
            
            # Convert CSV string to DataFrame
            df = pd.read_csv(io.StringIO(csv_content))
        else:
            # If no file but csv_data exists in json_data
            csv_data = json_data.get('csv_data')
            if csv_data:
                df = pd.read_csv(io.StringIO(csv_data))
            else:
                return JSONResponse(
                    status_code=400,
                    content={"error": "No CSV data provided"}
                )
    print("Data" , df, query, chat_history)
    # Call the text_to_sql function
    output = text_csv_results(df , query, chat_history)
    print("output", output)
    
    if output['response_type'] == 'conversation':
        return output
    
    print("Output is: ", output)
    
    # Convert DataFrame to different formats
    result_str = output['sql_result'].to_json(orient="records")
    
    # Create CSV string from DataFrame
    csv_string = output['sql_result'].to_csv(index=False)
    
    analysis_statement = output['analysis']['analysis'] if output['analysis'] else ""
    
    # Safely extract analysis and plot data with proper checks
    analysis_statement = ""
    analysis_plot = ""
    
    if output.get('analysis') and isinstance(output['analysis'], dict):
        # Get analysis text if available
        analysis_statement = output['analysis'].get('analysis', "")
        
        # Check if graph_plots exists and has image data
        if 'graph_plots' in output['analysis'] and isinstance(output['analysis']['graph_plots'], dict):
            graph_data = output['analysis']['graph_plots']
            if graph_data.get('image'):
                analysis_plot = graph_data
            elif graph_data.get('html_tag'):
                analysis_plot = graph_data.get('html_tag')
    
    style = """
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #DEE2E6;
        }
    </style>
    """
    html_table = style + output['sql_result'].to_html(index=False, classes='table table-bordered')
    
    return {
        "response_type": output['response_type'],
        "result": result_str,
        "sql_query": output['sql_query'],
        'table': JSONResponse(content=html_table),
        'analysis_statement': analysis_statement,
        'analysis_plot': analysis_plot,
        'csv_data': csv_string  # Add CSV data to the response
    }