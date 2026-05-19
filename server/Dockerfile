FROM php:8.4-cli

# Install system dependencies for PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libicu-dev \
    libpq-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions using the built-in helper
RUN docker-php-ext-install \
    bcmath \
    gd \
    intl \
    pdo_mysql \
    pdo_pgsql \
    zip

# Install Composer by copying it from the official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy the project files
COPY . /var/www/html

# Ensure correct permissions for the web server user
RUN chown -R www-data:www-data /var/www/html

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "/var/www/html"]