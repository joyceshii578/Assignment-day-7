School Database Design
Tables
students
Stores one row per student: an id (primary key), the student's name and their email. The email is UNIQUE, so two students cannot share one, and both name and email are NOT NULL.

courses
Stores one row per course: an id (primary key), the course title and the number of credits. Title and credits are NOT NULL.

enrolments
Records the fact that a student is taking a course. Each row has its own id, a student_id and a course_id (both foreign keys and NOT NULL), and the grade for that student on that course. The grade can be NULL while the course is still in progress. A UNIQUE (student_id, course_id) rule stops the same student enrolling on the same course twice.

Relationships
students to enrolments: one-to-many. One student can have many enrolments, but each enrolment belongs to exactly one student.
courses to enrolments: one-to-many. One course can have many enrolments, but each enrolment belongs to exactly one course.
students to courses: many-to-many. A student can take many courses, and a course can have many students.
A many-to-many relationship cannot be stored in a single column without repeating data or putting several values in one cell. The enrolments table is the join table that solves this. It turns the many-to-many link into two one-to-many links, with one row for each student-and-course pair. It is also the natural home for the grade, because a grade belongs to the pair, not to the student or the course alone.

Index
I would add an index on enrolments(course_id):

CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
Reason: queries such as "all students on a course" and "number of students per course" look up enrolments by course_id. Without an index the database scans every row in the table, which gets slow as enrolments grow. The UNIQUE (student_id, course_id) rule already creates an index that helps searches by student, so the course side is the one that needs it.

SQL or NoSQL?
I would choose SQL for this system. The data is structured and highly related: students, courses and enrolments connect to each other in a fixed, predictable way. SQL enforces that structure with primary keys, foreign keys, UNIQUE and NOT NULL rules, so bad data, such as an enrolment for a student who does not exist or a duplicate enrolment, is rejected by the database itself. Queries that combine tables, like finding all courses for a student or counting students per course, are easy to write with JOIN and GROUP BY. School records also need to be accurate and consistent, which suits SQL's transaction guarantees. NoSQL would be a better fit if the data had no fixed shape or had to scale across many servers, and neither is true of a school database.