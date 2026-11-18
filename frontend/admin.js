
const API_URL = "http://127.0.0.1:5000/api";

const ordersList = document.getElementById("ordersList");
const message = document.getElementById("message");

const statuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Load all orders
async function loadOrders() {
  message.textContent = "Loading orders...";
  ordersList.textContent = "Please wait...";

  try {
    const response = await fetch(
      API_URL + "/admin/orders",
      {
        credentials: "include"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please login first using your admin account.");
      }

      if (response.status === 403) {
        throw new Error("Access denied. Admin account required.");
      }

      throw new Error(result.message || "Unable to load orders.");
    }

    const orders = result.orders;

    if (!Array.isArray(orders)) {
      throw new Error("Invalid orders response.");
    }

    updateStats(orders);
    renderOrders(orders);

    message.textContent = "Admin access verified.";

  } catch (error) {
    ordersList.textContent = error.message;
    message.textContent = "Unable to load dashboard.";
  }
}

// Dashboard statistics
function updateStats(orders) {
  document.getElementById("totalOrders").textContent =
    orders.length;

  document.getElementById("pendingOrders").textContent =
    orders.filter(o => o.status === "Pending").length;

  document.getElementById("preparingOrders").textContent =
    orders.filter(o => o.status === "Preparing").length;

  document.getElementById("deliveredOrders").textContent =
    orders.filter(o => o.status === "Delivered").length;
}

// Display customer orders
function renderOrders(orders) {
  if (orders.length === 0) {
    ordersList.textContent = "No customer orders found.";
    return;
  }

  ordersList.innerHTML = orders.map(order => {
    const items = (order.items || []).map(item => `
      <p>
        ${escapeHTML(item.name)}
        × ${Number(item.quantity) || 0}
        — ₹${Number(item.subtotal || 0).toFixed(2)}
      </p>
    `).join("");

    const options = statuses.map(status => `
      <option value="${status}"
        ${order.status === status ? "selected" : ""}>
        ${status}
      </option>
    `).join("");

    const mapURL =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(order.address || "");

    return `
      <article class="order-card">

        <h3>Order #${escapeHTML(order._id)}</h3>

        <p>
          <strong>Customer:</strong>
          ${escapeHTML(order.customerName)}
        </p>

        <p>
          <strong>Phone:</strong>
          ${escapeHTML(order.phone)}
        </p>

        <p>
          <strong>Address:</strong>
          ${escapeHTML(order.address)}
        </p>

        <div class="order-items">
          <strong>Food Items</strong>
          ${items}
        </div>

        <p>
          <strong>Total:</strong>
          ₹${Number(order.totalAmount || 0).toFixed(2)}
        </p>

        <p>
          <strong>Current Status:</strong>
          ${escapeHTML(order.status)}
        </p>

        <p>
          <strong>Order Date:</strong>
          ${order.createdAt
            ? escapeHTML(new Date(order.createdAt).toLocaleString())
            : "Unavailable"}
        </p>

        <a
          class="map-button"
          href="${mapURL}"
          target="_blank"
          rel="noopener noreferrer">
          View Customer on Map
        </a>

        <div class="order-actions">

          <select class="status-select">
            ${options}
          </select>

          <button
            class="update-button"
            data-order-id="${escapeHTML(order._id)}">
            Update Status
          </button>

        </div>

      </article>
    `;
  }).join("");
}

// Update order status
ordersList.addEventListener("click", async event => {
  const button = event.target.closest(".update-button");

  if (!button) return;

  const card = button.closest(".order-card");
  const select = card.querySelector(".status-select");

  const orderId = button.dataset.orderId;
  const status = select.value;

  button.disabled = true;
  button.textContent = "Updating...";

  try {
    const response = await fetch(
      `${API_URL}/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ status })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Status update failed.");
    }

    message.textContent = "Order status updated successfully!";

    await loadOrders();

  } catch (error) {
    alert(error.message);
    button.disabled = false;
    button.textContent = "Update Status";
  }
});

// Refresh button
document.getElementById("refreshButton")
  .addEventListener("click", loadOrders);

// Initial load
loadOrders();
