# Description of Technologies for the Student Hostel Management System (SHMS)

The Student Hostel Management System (SHMS) for RP Musanze College will be developed using modern web technologies to create a professional, secure, user-friendly, and responsive web application. The system will help manage student information, hostels, rooms, accommodation requests, room allocation, check-in and check-out, hostel fees, manually verified payment records, maintenance requests, occupancy, and reports. The technologies used in the project will be divided into frontend technologies, backend technologies, database technologies, and development tools.

## 1. Frontend Technologies

HTML5 (HyperText Markup Language) will be used to create the basic structure of the web application. It will define the different elements of the system, including forms, tables, buttons, navigation menus, headings, and content sections. For example, HTML5 will provide the structure for the login page, student registration forms, hostel request forms, room management pages, payment recording interfaces, maintenance request forms, dashboards, and report pages.

CSS3 (Cascading Style Sheets) will be used to design and improve the appearance of the website. It will control colors, fonts, spacing, layouts, borders, and visual effects. CSS3 will help create a clean, attractive, and professional interface that is easy for students, hostel administrators, and system administrators to use. It will also support responsive design so that the application can adapt to different screen sizes on computers, laptops, tablets, and smartphones.

JavaScript will be used to add interactive functionality to the website. It will support form validation, search features, filtering, confirmation messages, and dynamic updates without unnecessary page reloads. For example, JavaScript will help users search for students, rooms, or hostel requests and receive immediate feedback when they submit information or perform administrative actions.

React will be used to build the main user interface of the system. It is a JavaScript library that allows developers to create reusable components and interactive pages. React will support the development of the administrator dashboard, student dashboard, student management pages, hostel and room management interfaces, request review screens, room allocation interface, check-in and check-out pages, fee and payment recording interfaces, maintenance management screens, occupancy views, and report sections. It will also make the application easier to maintain and extend as the system grows.

Tailwind CSS will be used to style the website efficiently and consistently. It provides utility classes that help developers create modern layouts, buttons, forms, tables, navigation menus, and dashboard displays. Tailwind CSS will help maintain a consistent design across the application and create a responsive interface that works well on desktop and mobile devices.

## 2. Backend Technologies

Node.js will be used to run JavaScript on the server side of the application. It will allow the system to process requests from students and administrators and communicate with the database. Node.js will support important operations such as retrieving student records, processing hostel accommodation requests, enforcing room capacity rules during allocation, recording check-in and check-out, calculating outstanding balances, and handling maintenance request updates.

Express.js will be used as the backend framework to organize the server and develop application programming interfaces (APIs). These APIs will allow the frontend to communicate with the backend securely. Express.js will handle operations such as user authentication, role-based access control, student management, hostel and room management, request review, room allocation, fee management, payment verification recording, maintenance management, occupancy monitoring, report generation, and audit logging. It will also help enforce access permissions so that students, hostel administrators, and system administrators can only perform actions allowed by their roles.

## 3. Database Technologies

MySQL will be used as the database management system for storing and organizing the information required by the Student Hostel Management System. It will store user accounts, student details, hostel and room records, accommodation requests, allocations, check-in and check-out records, hostel fees, verified payment records, maintenance requests, and audit logs. MySQL will help maintain relationships between different records through primary keys and foreign keys, reduce unnecessary duplication, enforce data constraints, and ensure that information can be retrieved and updated efficiently.

Prisma ORM (Object-Relational Mapping) will be used to simplify communication between the Node.js backend and the MySQL database. It will allow developers to work with database records using JavaScript instead of writing every database query manually. Prisma will help create, retrieve, update, and delete records for all main system entities, manage database structure changes, and maintain consistency between the application and the database. Using prepared database access through Prisma will also support secure handling of data and help reduce the risk of SQL injection.

## 4. Development Tools

Visual Studio Code (VS Code) will be used as the main code editor for writing, organizing, and managing the project's source code. It supports JavaScript, React, Node.js, and other technologies required for the system. Its extensions, debugging features, and integrated terminal will help identify errors, improve code quality, and increase development productivity.

Git will be used for version control. It will track changes made to the source code and allow developers to return to previous versions when necessary. This will help manage updates safely, support collaborative development, and reduce the risk of losing important work during the project.

GitHub will be used to store the project's source code online and support collaboration among team members. It will allow developers to share code, review changes, manage project tasks, and maintain a central repository for the Student Hostel Management System.

## 5. How the Technologies Will Work Together

The frontend technologies, including HTML5, CSS3, JavaScript, React, and Tailwind CSS, will provide the interface through which students and administrators interact with the system. The backend technologies, Node.js and Express.js, will process their requests, apply business rules, and manage access permissions. Prisma ORM will connect the backend to the MySQL database, where the system's information will be stored and retrieved. Together, these technologies will create an integrated web application for managing hostel accommodation at RP Musanze College.

For example, when a student submits a hostel accommodation request, the React frontend will display the request form and send the information to the Express.js backend through a secure API. The backend will validate the request, prevent duplicate active requests where applicable, and store the request in MySQL through Prisma with a Pending status. When an authorized hostel administrator reviews the request, the system will record the approval or rejection decision. If the request is approved, the administrator can allocate the student to a room only when available spaces remain, based on the rule that available spaces equal room capacity minus assigned students. The student can then view the updated request status and assigned room through the student dashboard.

In another example, when a student pays hostel fees using an approved external payment method, the student brings the payment proof physically to the hostel administrator. The administrator manually verifies the proof outside the system and then records the confirmed payment amount, date, method, and reference number where applicable through the payment management interface. The backend stores the verified payment record in MySQL and updates the student's payment history and outstanding balance. The system will not include an online payment gateway or a payment-proof upload feature. Students will not pay fees inside the system.

## Conclusion

In conclusion, using HTML5, CSS3, JavaScript, React, Tailwind CSS, Node.js, Express.js, MySQL, and Prisma ORM will provide a suitable foundation for developing a professional, responsive, secure, and maintainable Student Hostel Management System for RP Musanze College. These technologies will support accurate record management, role-based access control, room-capacity-based allocation, manual payment verification and recording, maintenance handling, occupancy monitoring, reporting, and long-term system maintainability according to the defined project requirements.
