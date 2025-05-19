from src.connection import get_secret, get_snowflake_connection
import pandas as pd


def get_data(query):
    secrets = get_secret()
    conn_snf = get_snowflake_connection(secrets)
    data = pd.read_sql(query, conn_snf)
    #print("result", data , type(data))
    return data