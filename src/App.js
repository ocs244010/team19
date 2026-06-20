import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export default function App() {

  // ✅ 画面（チャットがメイン）
  const [view, setView] = useState("chat");

  // ✅ ログイン
  const [user, setUser] = useState(
    localStorage.getItem("user")
  );
  const [nameInput, setNameInput] = useState("");
  const [passInput, setPassInput] = useState("");

  const users = [
    { name: "山田", password: "1234567" },
    { name: "田中", password: "7654321" }
  ];

  const login = () => {
    const ok = users.find(
      (u) => u.name === nameInput && u.password === passInput
    );
  
    if (ok) {
      setUser(ok.name);
      localStorage.setItem("user", ok.name);
      document.activeElement.blur();
    }

    else alert("ログイン失敗");
  };

  // =====================
  // ✅ チャット
  // =====================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      data.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const el = document.getElementById("chat-box");

    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input || !user) return;

    await addDoc(collection(db, "messages"), {
      text: input,
      name: user,
      createdAt: Date.now() + Math.random()
    });

    setInput("");
  };

  // =====================
  // ✅ シフト
  // =====================
  const [sheet, setSheet] = useState({});

  const [month, setMonth] = useState(() => {
    return Number(localStorage.getItem("month")) || 5;
  });

  const [staffCount, setStaffCount] = useState(1);
  const [staffNames, setStaffNames] = useState([""]);

  const handleMonthChange = async (newMonth) => {
    const ok = window.confirm(
      "月を変更すると入力した内容は全て消えます。よろしいですか？"
    );
    if (!ok) return;

    localStorage.setItem("month", newMonth);
    setMonth(newMonth);

    // ✅ リセット
    setStaffCount(1);
    setStaffNames([""]);

    setSheet({});
    await setDoc(doc(db, "sheet", "shift"), {});
  };

  const getDays = () => {
    const year = new Date().getFullYear();

    const start = new Date(year, month - 1, 11);

    const end =
      month === 12
        ? new Date(year + 1, 0, 10)   // 1月10日
        : new Date(year, month, 10); // 次月10日

    let days = [];
    let d = new Date(start);

    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);

      // ✅ 安全装置（超重要）
      if (days.length > 40) break;
    }

    return days;
  };

  const days = getDays();

  const getDay = (date) => {
    return ["日","月","火","水","木","金","土"][date.getDay()];
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sheet", "shift"), (docSnap) => {
      if (docSnap.exists()) setSheet(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
        window.scrollTo(0, 0);
      }, 50);
    }
  }, [user]);

  const updateCell = async (key, value) => {
    const newSheet = { ...sheet, [key]: value };
    setSheet(newSheet);
    await setDoc(doc(db, "sheet", "shift"), newSheet);
  };

  const updateName = (index, value) => {
    const newNames = [...staffNames];
    newNames[index] = value;
    setStaffNames(newNames);
  };

  return (
    <div style={{
      padding: 20,
      fontFamily: "sans-serif",
      fontSize: 16
    }}>

      {!user && (
        <>
          <h3>ログイン</h3>

          <input
            placeholder="名前"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="7桁パスワード"
            value={passInput}
            maxLength={7}
            onChange={(e) => setPassInput(e.target.value)}
          />
          <br /><br />

          <button onClick={login}>ログイン</button>
        </>
      )}

  {user && (
    <>
      {/* ✅ タブ（完成UI） */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #ddd",
        marginBottom: 15
      }}>
        <div style={{ display: "flex" }}>
         <div
           onClick={() => setView("chat")}
           style={{
             padding: "10px 20px",
             cursor: "pointer",
             borderBottom: view === "chat" ? "3px solid #4CAF50" : "none",
             fontWeight: view === "chat" ? "bold" : "normal"
           }}
         >
           チャット
         </div>

         <div
           onClick={() => setView("shift")}
           style={{
             padding: "10px 20px",
             cursor: "pointer",
             borderBottom: view === "shift" ? "3px solid #4CAF50" : "none",
             fontWeight: view === "shift" ? "bold" : "normal"
           }}
         >
           シフト
         </div>
        </div>
      
        <button
          onClick={() => {
            setUser(null);
            localStorage.removeItem("user");
          }}
          style={{
            padding: "6px 12px",
            marginRight: 10,
            cursor: "pointer"
          }}
        >
          ログアウト
        </button>

      </div>

      {/* =====================
          ✅ チャット（LINE風UI）
      ===================== */}
      {view === "chat" && (
        <>
          <div
            id="chat-box"
            style={{
              height: "60vh",       // 高さ固定
              overflowY: "auto",    // スクロール
              marginBottom: 10,
              padding: 10,
              background: "#f5f5f5"
            }}
          >
            {messages.map((m, i) => {
              const isMe = m.name === user;

              return (
                <div
                  key={i}
                  style={{
                    textAlign: isMe ? "right" : "left",
                    marginBottom: 10
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: isMe ? "#4CAF50" : "#ddd",
                      color: isMe ? "white" : "black",
                    }}
                  >
                    {!isMe && m.name ? `${m.name}: ` : ""}{m.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 5 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
                fontSize: 16,
                borderRadius: 5,
                border: "1px solid #ccc"
              }}
            />
            <button onClick={sendMessage}>
              送信
            </button>
          </div>
        </>
      )}

      {/* =====================
          ✅ シフト（最終UI）
      ===================== */}
      {view === "shift" && (
        <>
          <h3>{month}月11日〜{month + 1}月10日</h3>

          <div style={{ marginBottom: 10 }}>
            月：
            <select
              value={month}
              onChange={(e) =>
                handleMonthChange(Number(e.target.value))
              }
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>

            人数：
            <select
              value={staffCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setStaffCount(n);
                
                setStaffNames((prev) => {
                  const newNames = [...prev];

                  // ✅ 足りない分だけ追加
                  while (newNames.length < n) {
                    newNames.push("");
                  }

                  // ✅ 多すぎる分は削除
                  return newNames.slice(0, n);
                });
              }}
            >
              {[1,2,3,4,5].map(n => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            {Array.from({ length: staffCount }).map((_, i) => (
              <input
                key={i}
                placeholder={`名前${i+1}`}
                value={staffNames[i] || ""}
                onChange={(e) =>
                  updateName(i, e.target.value)
                }
                style={{
                  width: "50px",
                  marginRight: 10,
                  padding: 5
                }}
              />
            ))}
          </div>

          <table
            style={{
              borderCollapse: "collapse"
            }}
          >
            <thead>
              <tr style={{ background: "#2c4a70", color: "white" }}>
                <th style={{ padding: 5 }}>日付</th>
                <th style={{ padding: 5 }}>曜日</th>

                {Array.from({ length: staffCount }).map((_, i) => (
                  <th key={i} style={{ padding: 5 }}>
                    {staffNames[i] || `名前${i+1}`}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map((date) => {
                const day = date.getDate();

                return (
                  <tr key={day}>
                    <td style={{ border: "1px solid #aaa", textAlign: "center" }}>
                      {day}
                    </td>

                    <td
                      style={{
                        border: "1px solid #aaa",
                        textAlign: "center",
                        color: getDay(date) === "日" ? "red" : "black"
                      }}
                    >
                      {getDay(date)}
                    </td>

                    {Array.from({ length: staffCount }).map((_, i) => (
                      <td
                        key={i}
                        style={{
                          border: "1px solid #aaa",
                          textAlign: "center"
                        }}
                      >
                        <input
                          value={sheet[`cell_${i}_${day}`] || ""}
                          onChange={(e) =>
                            updateCell(`cell_${i}_${day}`, e.target.value)
                          }
                          style={{
                            width: "80px",
                            padding: 3
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
     </>
    )}
    </div>
  );
}