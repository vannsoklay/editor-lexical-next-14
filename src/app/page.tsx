"use client"
import MyEditor from "./components/Editor";
import { useState } from "react";

export default function Home() {
  const [detail, setDetail] = useState();
  return (
    <div className="p-12">
      <MyEditor/>
    </div>
  );
}
