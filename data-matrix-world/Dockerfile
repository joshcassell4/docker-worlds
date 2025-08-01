FROM python:3.11-slim

WORKDIR /app

# Install required Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set terminal environment for better color support
ENV TERM=xterm-256color
ENV PYTHONUNBUFFERED=1
ENV COLORTERM=truecolor

CMD ["python", "data_matrix.py"]