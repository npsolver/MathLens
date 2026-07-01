# Use the arch-specific tag so Apple Silicon builds produce a true x86_64 image.
FROM public.ecr.aws/lambda/python:3.12-x86_64

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip3 install --no-cache-dir -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

COPY app ${LAMBDA_TASK_ROOT}/app
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

ENTRYPOINT ["/lambda-entrypoint.sh"]
CMD ["lambda_handler.handler"]
