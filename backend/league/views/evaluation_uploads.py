import pandas as pd
import logging
import traceback
import re

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from django.core.exceptions import ValidationError

from league.services.add_evaluations import import_evaluations_from_csv

logger = logging.getLogger(__name__)


class UploadEvaluationCSVView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):

        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file.name.endswith(".csv"):
            return Response(
                {"error": "File must be a CSV"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        temp_path = f"/tmp/{file.name}"

        try:

            # Save uploaded file
            with open(temp_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            logger.info(f"Uploaded CSV saved to {temp_path}")

            # Read CSV
            try:
                df = pd.read_csv(temp_path, dtype=str)
                df = df.loc[:, ~df.columns.str.startswith("Unnamed")]
                df = df.fillna("")
            except Exception as e:
                logger.exception("CSV parsing failure")
                return Response(
                    {
                        "error": "Failed to parse CSV",
                        "details": str(e),
                        "trace": traceback.format_exc(),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            logger.info(f"CSV Loaded: {len(df)} rows")

            failures = []
            processed_count = 0

            required_columns = [
                "Player",
                "Hitting Form",
                "Hitting Power",
                "Hitting Contact",
                "Fielding Form",
                "Fielding Glove",
                "Fielding Hustle",
                "Throwing Form",
                "Throwing Speed",
                "Throwing Accuracy",
                "Batting Hand",
                "Throwing Hand",
                "Pitching Speed",
                "Pitching Accuracy",
                "Catcher Receiving",
                "Catcher Blocking",
            ]

            optional_columns = {
                "Batting Hand",
                "Pitching Speed",
                "Pitching Accuracy",
                "Catcher Receiving",
                "Catcher Blocking",
                "Throwing Hand",
            }

            # Validate columns exist
            missing_columns = [c for c in required_columns if c not in df.columns]

            if missing_columns:
                return Response(
                    {
                        "error": "CSV missing required columns",
                        "missing_columns": missing_columns,
                        "columns_found": list(df.columns),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate each row
            for index, row in df.iterrows():

                try:

                    logger.info(f"Processing row {index + 2}")
                    logger.debug(row.to_dict())

                    missing_fields = []

                    for col in required_columns:

                        if col in optional_columns:
                            continue

                        value = row.get(col, "")

                        if str(value).strip() == "":
                            missing_fields.append(col)

                    if missing_fields:
                        failures.append(
                            {
                                "row": index + 2,
                                "player": row.get("Player"),
                                "error": "Missing required values",
                                "fields": missing_fields,
                                "row_data": row.to_dict(),
                            }
                        )
                        continue

                    processed_count += 1

                except Exception as row_error:

                    logger.exception(f"Row {index + 2} failed")

                    failures.append(
                        {
                            "row": index + 2,
                            "player": row.get("Player"),
                            "error": str(row_error),
                            "trace": traceback.format_exc(),
                            "row_data": row.to_dict(),
                        }
                    )

            # Now pass CSV to service layer
            try:

                service_result = import_evaluations_from_csv(temp_path)

            except Exception as service_error:

                logger.exception("Service layer failure")

                return Response(
                    {
                        "error": "Service failed while importing evaluations",
                        "details": str(service_error),
                        "trace": traceback.format_exc(),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            service_failures = []
            service_processed = 0

            if isinstance(service_result, dict):

                service_failures = service_result.get("failures", [])
                service_processed = service_result.get("processed", 0)

            elif isinstance(service_result, list):

                service_failures = service_result

            elif isinstance(service_result, str):

                service_failures = [
                    {
                        "row": "unknown",
                        "error": service_result,
                    }
                ]

            # Enhance service errors
            enhanced_service_failures = []

            for failure in service_failures:

                if isinstance(failure, str):

                    enhanced_service_failures.append(
                        {"row": "unknown", "error": failure}
                    )
                    continue

                error_msg = failure.get("error", "")

                fields = re.findall(
                    r"(?:column|field)s?:?\s*([\w\s]+)",
                    error_msg,
                    re.IGNORECASE,
                )

                enhanced = failure.copy()

                if fields:
                    enhanced["fields"] = [f.strip() for f in fields]

                enhanced_service_failures.append(enhanced)

            combined_failures = failures + enhanced_service_failures
            processed_count += service_processed

            return Response(
                {
                    "processed": processed_count,
                    "failure_count": len(combined_failures),
                    "failures": combined_failures,
                },
                status=status.HTTP_200_OK,
            )

        except ValidationError as e:

            logger.exception("Validation failure")

            return Response(
                {
                    "error": "Validation error",
                    "details": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:

            logger.exception("Unhandled CSV upload failure")

            return Response(
                {
                    "error": "Failed to process file",
                    "details": str(e),
                    "trace": traceback.format_exc(),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )