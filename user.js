const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

let allUsers = []; // stored here so filtering needs no new request

async function loadUsers() {
    statusEl.textContent = "Loading users...";
    loadButton.disabled = true;

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        allUsers = await response.json();
        renderUsers(allUsers);
        statusEl.textContent = `Loaded ${allUsers.length} users.`;
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
    } finally {
        loadButton.disabled = false;
    }
}

function renderUsers(list) {
    usersList.innerHTML = "";

    for (const user of list) {
        const item = document.createElement("li");

        const name = document.createElement("strong");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        item.append(name, email, city, company);
        usersList.appendChild(item);
    }
}

function filterUsers() {
    if (allUsers.length === 0) {
        return; // nothing loaded yet
    }

    const search = filterInput.value.trim().toLowerCase();
    const matches = allUsers.filter((user) =>
        user.name.toLowerCase().includes(search)
    );

    renderUsers(matches);

    if (matches.length === 0) {
        statusEl.textContent = "No users match your filter.";
    } else {
        statusEl.textContent = `Showing ${matches.length} of ${allUsers.length} users.`;
    }
}

loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);