
"use client";
import { useEffect, useState } from "react";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");

  async function load() {
    const res = await fetch("/api/bills");
    setBills(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create() {
    await fetch("/api/bills", {
      method: "POST",
      body: JSON.stringify({ description: desc, amount: value, due_date: date }),
    });
    setDesc(""); setValue(""); setDate(""); load();
  }

  async function pay(id) {
    await fetch(`/api/bills/${id}`, { method: "PATCH" });
    load();
  }

  async function remove(id) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Contas a pagar</h1>

      <input placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} />
      <input placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button onClick={create}>Adicionar</button>

      {bills.map(b => (
        <div key={b.id} style={{ border: "1px solid", margin: 10, padding: 10 }}>
          <b>{b.description}</b>
          <p>R$ {b.amount}</p>
          <p>{b.due_date}</p>
          {!b.paid && <button onClick={() => pay(b.id)}>Pagar</button>}
          <button onClick={() => remove(b.id)}>Excluir</button>
        </div>
      ))}
    </div>
  );
}
