FROM python:3.11-bookworm

WORKDIR /opt

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    bash \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV SPARK_HOME=/usr/local/lib/python3.11/site-packages/pyspark
ENV PYTHONPATH=/opt/streaming${PYTHONPATH:+:$PYTHONPATH}

RUN pip install --no-cache-dir pyspark==3.5.1

COPY streaming /opt/streaming
RUN chmod +x /opt/streaming/spark/submit.sh

CMD ["/opt/streaming/spark/submit.sh"]
