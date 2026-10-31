Base URL: /api

The API manages a library's books. Each book looks like this:

{
  "id": 1,
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958,
  "isbn": "9780385474542"
}
Endpoints
1. List all books
Method: GET
Path: /books
Description: Returns every book in the library.
Request body: none
Success status: 200 OK
2. Get one book
Method: GET
Path: /books/{id}
Description: Returns the book with the given id.
Request body: none
Success status: 200 OK
3. Create a book
Method: POST
Path: /books
Description: Adds a new book to the library.
Example request body:
{
  "title": "Weep Not, Child",
  "author": "Ngugi wa Thiong'o",
  "year": 1964,
  "isbn": "9780435908300"
}
Success status: 201 Created
4. Update a book
Method: PUT
Path: /books/{id}
Description: Replaces the details of an existing book.
Example request body:
{
  "title": "Weep Not, Child",
  "author": "Ngugi wa Thiong'o",
  "year": 1964,
  "isbn": "9780435908301"
}
Success status: 200 OK
5. Delete a book
Method: DELETE
Path: /books/{id}
Description: Removes the book with the given id.
Request body: none
Success status: 204 No Content
6. List books by an author
Method: GET
Path: /books?author={name}
Description: Returns only the books written by the given author.
Example: /books?author=Chinua%20Achebe
Request body: none
Success status: 200 OK (an empty list [] if the author has no books)
Error codes
400 Bad Request
The request is invalid or missing required data.
Example: POST /books with a body that has no title, or PUT /books/abc where the id is not a number.
404 Not Found
The requested book does not exist.
Example: GET /books/999 when no book has id 999, or DELETE /books/999 for a book that was already removed.