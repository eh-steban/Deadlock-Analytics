FROM python:latest

WORKDIR /app

# RUN apt-get update && apt-get install -y libpq-dev gcc && apt-get clean

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt /app/
RUN pip install -r requirements.txt
RUN echo 'alias devserver="uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"' >> ~/.bashrc

COPY . /app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
