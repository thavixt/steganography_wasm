FROM php:8.2-cli

RUN apt-get update \
  && apt-get install -y libpq-dev \
  && docker-php-ext-configure pgsql --with-pgsql=/usr/local/pgsql \
  && docker-php-ext-install pgsql pdo pdo_pgsql 

COPY . /var/www/html
WORKDIR /var/www/html

CMD ["php", "-S", "0.0.0.0:8000", "-t", "/var/www/html"]