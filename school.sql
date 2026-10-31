PRAGMA foreign_keys = ON;

-- Start clean so the script can be re-run
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ---------- Tables ----------
CREATE TABLE students (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id      INTEGER PRIMARY KEY,
    title   TEXT NOT NULL,
    credits INTEGER NOT NULL
);

CREATE TABLE enrolments (
    id         INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id  INTEGER NOT NULL,
    grade      INTEGER CHECK (grade BETWEEN 0 AND 100),  -- NULL = not graded yet
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id)  REFERENCES courses(id),
    UNIQUE (student_id, course_id)  -- same student cannot enrol on the same course twice
);

-- ---------- Sample data ----------
INSERT INTO students (id, name, email) VALUES
    (1, 'Amina Wanjiku', 'amina@example.com'),
    (2, 'Brian Otieno',  'brian@example.com'),
    (3, 'Grace Mwangi',  'grace@example.com'),
    (4, 'David Kimani',  'david@example.com');

INSERT INTO courses (id, title, credits) VALUES
    (1, 'Web Development', 4),
    (2, 'Databases',       3),
    (3, 'Mathematics',     3);

INSERT INTO enrolments (id, student_id, course_id, grade) VALUES
    (1, 1, 1, 85),
    (2, 1, 2, 78),
    (3, 2, 1, 64),
    (4, 3, 1, 90),
    (5, 3, 3, NULL),
    (6, 2, 2, 71);

-- ---------- Queries ----------

-- 1. All courses for one student (by name)
SELECT courses.title, enrolments.grade
FROM students
JOIN enrolments ON enrolments.student_id = students.id
JOIN courses    ON courses.id = enrolments.course_id
WHERE students.name = 'Amina Wanjiku';

-- 2. All students on one course
SELECT students.name, students.email
FROM courses
JOIN enrolments ON enrolments.course_id = courses.id
JOIN students   ON students.id = enrolments.student_id
WHERE courses.title = 'Web Development';

-- 3. Number of students per course (LEFT JOIN keeps courses with 0 students)
SELECT courses.title, COUNT(enrolments.id) AS student_count
FROM courses
LEFT JOIN enrolments ON enrolments.course_id = courses.id
GROUP BY courses.id, courses.title;

-- 4. Students who have no enrolments
SELECT students.name
FROM students
LEFT JOIN enrolments ON enrolments.student_id = students.id
WHERE enrolments.id IS NULL;

-- 5. Update one enrolment's grade (Brian's grade in Web Development)
UPDATE enrolments
SET grade = 70
WHERE student_id = 2 AND course_id = 1;

-- Check the update
SELECT students.name, courses.title, enrolments.grade
FROM enrolments
JOIN students ON students.id = enrolments.student_id
JOIN courses  ON courses.id = enrolments.course_id
WHERE enrolments.student_id = 2 AND enrolments.course_id = 1;