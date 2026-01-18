// backend/src/services/inventory.service.js

console.log("🔥 inventory.service.js LOADED");

async function applyInventoryMovement({
  productId,
  quantity,
  type,
  unitCost,
  userId,
  client,
}) {
  console.log("✅ INVENTORY MOVEMENT RUNNING", {
    productId,
    quantity,
    unitCost,
    type,
  });

  const inv = await client.query(
    `
    SELECT quantity, avg_cost
    FROM inventory
    WHERE product_id = $1
    FOR UPDATE
    `,
    [productId]
  );

  if (!inv.rowCount) {
    throw new Error("Inventory record not found");
  }

  const currentQty = Number(inv.rows[0].quantity);
  const currentCost = Number(inv.rows[0].avg_cost);

  // ✅ default: never change avg_cost unless INBOUND
  let newQty = currentQty;
  let newAvgCost = currentCost;

  if (type === "INBOUND") {
    // unitCost MUST be a number for inbound
    if (unitCost === undefined || unitCost === null || Number.isNaN(Number(unitCost)) || Number(unitCost) < 0) {
      throw new Error("unit_cost is required for INBOUND");
    }

    const u = Number(unitCost);
    newQty = currentQty + Number(quantity);

    const totalValue = currentQty * currentCost + Number(quantity) * u;
    newAvgCost = newQty === 0 ? 0 : totalValue / newQty;
  } else if (type === "OUTBOUND") {
    newQty = currentQty - Number(quantity);

    if (newQty < 0) {
      throw new Error("Insufficient stock");
    }

    // 🚫 outbound: avg_cost stays the same
    newAvgCost = currentCost;
  } else {
    throw new Error("Invalid movement type");
  }

  await client.query(
    `
    UPDATE inventory
    SET quantity = $1,
        avg_cost = $2,
        updated_at = NOW()
    WHERE product_id = $3
    `,
    [newQty, newAvgCost, productId]
  );
}

module.exports = { applyInventoryMovement };
