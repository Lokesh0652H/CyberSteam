FROM bitnami/spark:3.5.0

USER root

# Install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy job scripts
COPY jobs/ /opt/spark-apps/jobs/
COPY submit.sh /opt/spark-apps/

RUN chmod +x /opt/spark-apps/submit.sh

USER 1001

WORKDIR /opt/spark-apps
CMD ["./submit.sh"]
