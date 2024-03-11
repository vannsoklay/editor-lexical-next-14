"use client"
import Editor from "./components/Editor";
import { useState } from "react";

export default function Home() {
  const [detail, setDetail] = useState();
  return (
    <div>
      <Editor/>
    </div>
  );
}
