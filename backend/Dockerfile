FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      unixodbc \
      unixodbc-dev \
      odbc-mariadb \
    && printf "[MariaDB ODBC 3.2 Driver]\nDriver=/usr/lib/x86_64-linux-gnu/odbc/libmaodbc.so\nUsageCount=1\n" > /etc/odbcinst.ini \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["gunicorn", "--bind", "0.0.0.0:4000", "server:app"]
