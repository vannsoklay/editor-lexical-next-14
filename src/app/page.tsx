"use client"
import MyEditor from "./components/Editor";
import { useState } from "react";

export default function Home() {
  const [detail, setDetail] = useState();
  return (
    <div>
      <MyEditor/>
    </div>
  );
}
