# Personal Expense Tracker

A web application built using HTML, CSS, JavaScript,
Node.js, Express, and Docker.

## Features

- Add expenses
- View expenses
- Edit expenses
- Delete expenses
- Expense categories
- Calculate total expenses
- Search expenses
- Filter by category
- Display monthly expenses
- Example expenses
- Docker deployment
- Persistent JSON storage

## Technologies

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- Docker

## Run Locally

Install Node.js, then open a terminal in the project folder.

Install dependencies:

npm install

Start the server:

npm start

Open the application:

http://localhost:3000

## Run with Docker

Build the image:

docker build -t personal-expense-tracker .

Run the container:

docker run -d --name expense-tracker -p 3000:3000 -v expense-data:/app/data personal-expense-tracker

Open:

http://localhost:3000

## Example Expenses

Food: Rs. 150
Transport: Rs. 80
Shopping: Rs. 500
Education: Rs. 300
Entertainment: Rs. 200

Total Expense: Rs. 1230

## API Endpoints

GET /api/expenses
POST /api/expenses
PUT /api/expenses/:id
DELETE /api/expenses/:id
GET /api/health
