FROM python:latest

WORKDIR /app

# RUN apt-get update && apt-get install -y libpq-dev gcc && apt-get clean

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt /app/
RUN pip install -r requirements.txt

COPY . /app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]