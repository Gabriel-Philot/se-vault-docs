# Databricks notebook source

# Standard libraries
from pyspark.sql import functions as F
from pyspark.sql import SparkSession, DataFrame
from typing import List
from datetime import date, timedelta

# Repo imports
import sys, os
try:
    sys.path.append("/Workspace/Shared/workspace")
    from utils.delta_functions import save_table
    from club_b.utils.logger_club import logger
    from club_b.utils.spark_config import get_spark_with_optimization
    from club_b.utils.helpers import (
        helper_countries_and_reference_date,
        helper_config_pretty,
        cast_df_to_schema
    )
except:
    sys.path.append(os.path.abspath("../../../../"))
    from utils.logger_club import logger
    from utils.save_local import save_table
    from utils.spark_config import get_spark_with_optimization, get_spark_dev_local
    from utils.helpers import (
        helper_countries_and_reference_date,
        helper_config_pretty,
        cast_df_to_schema
    )

# Task imports
from poc_vendors_base_intermediate_config import Config

# Transformations imports
from lib_utils.transformations import (
    build_poc_vendors_base_intermediate_df
)

# COMMAND ----------


class PocVendorsBaseIntermediate(Config):
    def __init__(self, countries: List[str], start_date: str, catalog: str, schema_df) -> None:
        self.spark = get_spark_with_optimization()
        self.countries = countries
        self.start_date = start_date
        self.reference_date = start_date  # Daily reference
        self.schema_df = schema_df
        self.catalog = catalog

    def create_views_and_build_final(
        self,
        spark: SparkSession,
        countries: List[str],
        reference_date: str
    ) -> DataFrame:
        """Build POC Vendors Base Intermediate dataframe.

        Args:
            spark: SparkSession instance
            countries: List of country codes to process
            reference_date: Reference date for the snapshot (YYYY-MM-DD)

        Returns:
            DataFrame: Consolidated vendor contracts dataframe
        """
        final_df = build_poc_vendors_base_intermediate_df(
            spark,
            self.source_dim_contracts_scd,
            self.source_dim_contract,
            self.source_contractless,
            countries,
            reference_date,
            logger=logger
        )

        return final_df

    def main(self) -> DataFrame:
        """Orchestrate the POC Vendors Base Intermediate pipeline.

        Returns:
            pyspark.sql.DataFrame: Final dataframe cast to self.schema_df
        """
        logger.info(f"Processing POC Vendors Base Intermediate")
        logger.info(f"Countries: {self.countries}")
        logger.info(f"Reference date: {self.reference_date}")
        
        final_df = self.create_views_and_build_final(
            self.spark,
            self.countries,
            self.reference_date
        )

        return cast_df_to_schema(final_df, self.schema_df)

    def run_task(self):
        """Execute the complete pipeline and save results to Delta table."""
        try:
            df_save = self.main()
            if not df_save.isEmpty():
                country_condition = " OR ".join([f"country = '{country.upper()}'" for country in self.countries])
                final_condition = f"reference_date = '{self.reference_date}' AND ({country_condition})"

                logger.info(df_save.printSchema())
                save_table(
                    data=df_save,
                    table_name=self.full_table_name,
                    primary_keys=self.primary_keys,
                    mode=self.mode,
                    partition_columns=self.partition_columns,
                    overwrite_options={
                        "replaceWhere": final_condition
                    }
                )

                logger.info(f"\ncountries = {self.countries}, reference_date = {self.reference_date}\n")
                logger.info(f"Process finished for {self.full_table_name}")
            else:
                logger.warn("df_save is empty")

        except Exception as e:
            logger.info(f"Error occurred for countries {self.countries} and reference_date {self.reference_date}: {str(e)}")
            raise


# COMMAND ----------

# MAGIC %md
# MAGIC
# MAGIC ### Parameters

# COMMAND ----------

try:
    dbutils.widgets.text("country", "")
    dbutils.widgets.text("start_date", "")
except NameError:
    pass

# COMMAND ----------

try:
    countries_input = dbutils.widgets.get("country")
    start_date_input = dbutils.widgets.get("start_date")
except NameError:
    countries_input = ""
    start_date_input = ""

if not countries_input or countries_input == '':
    countries_input = ["PE", "PY"]

if not start_date_input or start_date_input == '':
    start_date_input = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

countries = helper_countries_and_reference_date(
    countries_input,
    start_date_input,
    logger
)


# COMMAND ----------

params = Config()
helper_config_pretty(params, logger)

# COMMAND ----------

# MAGIC %md
# MAGIC
# MAGIC ### Run

# COMMAND ----------

instance = PocVendorsBaseIntermediate(
    countries=countries,
    start_date=start_date_input,
    catalog=params.catalog,
    schema_df=params.schema_df
)
instance.run_task()
