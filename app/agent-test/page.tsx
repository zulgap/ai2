'use client';

import React, { useEffect, useState, useRef } from "react";
import {
  AppBar, Toolbar, Typography, Button, Container, Box, TextField, Paper, List, ListItem, Grid, Chip, Avatar, Divider, IconButton, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';

type Agent = {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string;
};

type Task = {
  id: string;
  label: string;
  done?: boolean;
  active?: boolean;
};

type Team = { id: string; name: string };

export default function AgentTest() {
  // 팀 목록
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // 에이전트/작업 목록
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 채팅 상태
  const [messages, setMessages] = useState<{ sender: string; text: string; time?: string }[]>([
    { sender: "에이전트", text: "AI 멀티 에이전트 시스템이 시작되었습니다. 어떤 작업을 도와드릴까요?", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 팀 목록 불러오기
  useEffect(() => {
    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        if (data.length > 0) setSelectedTeamId(data[0].id);
      });
  }, []);

  // 팀 변경 시 에이전트/작업 불러오기
  useEffect(() => {
    if (!selectedTeamId) return;
    fetch(`/api/agents?teamId=${selectedTeamId}`)
      .then(res => res.json())
      .then(data => setAgents(data));
    fetch(`/api/tasks?teamId=${selectedTeamId}`)
      .then(res => res.json())
      .then(data => setTasks(data));
    // 채팅 초기화(선택)
    setMessages([
      { sender: "에이전트", text: "AI 멀티 에이전트 시스템이 시작되었습니다. 어떤 작업을 도와드릴까요?", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
    ]);
  }, [selectedTeamId]);

  // 채팅 스크롤 항상 아래로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 채팅 전송
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "나", text: input, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          message: input
        })
      });
      const data = await res.json();
      setMessages(msgs => [
        ...msgs,
        { sender: "에이전트", text: data.reply ?? "작업을 확인했습니다. 다음 단계로 진행할까요?", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
      ]);
    } catch {
      setMessages(msgs => [
        ...msgs,
        { sender: "에이전트", text: "에이전트 응답에 실패했습니다.", time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
      ]);
    }
  };

  // 엔터로 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  // 네비게이션 이동
  const handleNav = (path: string) => {
    window.location.href = path;
  };

  // 팀 선택 핸들러
  const handleTeamChange = (e: any) => setSelectedTeamId(e.target.value);

  return (
    <Box sx={{ bgcolor: "#f7f8fa", minHeight: "100vh" }}>
      {/* 상단 네비게이션 */}
      <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #eee" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#222" }}>AI 에이전트 시스템</Typography>
          <Button color="inherit" sx={{ fontWeight: 700, color: "#222" }} onClick={() => handleNav("/agent-test")}>에이전트 채팅</Button>
          <Button color="inherit" sx={{ fontWeight: 700, color: "#222" }} onClick={() => handleNav("/workflows")}>워크플로우</Button>
          <Button color="inherit" sx={{ fontWeight: 700, color: "#222" }} onClick={() => handleNav("/org")}>조직 관리</Button>
          <Button color="inherit" sx={{ fontWeight: 700, color: "#222" }} onClick={() => handleNav("/settings")}>에이전트 설정</Button>
        </Toolbar>
      </AppBar>

      {/* 팀 선택 드롭다운 */}
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>팀 선택</InputLabel>
          <Select
            value={selectedTeamId}
            label="팀 선택"
            onChange={handleTeamChange}
            size="small"
          >
            {teams.map(team => (
              <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Container>

      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Grid container spacing={3}>
          {/* 좌측: 채팅 */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper sx={{ height: 600, display: "flex", flexDirection: "column", p: 0, overflow: "hidden" }}>
              {/* 탭/필터 영역 (예시) */}
              <Box sx={{ display: "flex", borderBottom: "1px solid #eee", bgcolor: "#fafbfc" }}>
                <Button sx={{ borderRadius: 0, fontWeight: 700, color: "#222", borderBottom: "2px solid #222" }}>에이전트 채팅</Button>
                <Button sx={{ borderRadius: 0, color: "#888" }}>문서 분석 중</Button>
              </Box>
              {/* 채팅 메시지 영역 */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 3, bgcolor: "#f7f8fa" }}>
                {messages.map((msg, idx) => (
                  <Box key={idx} sx={{ display: "flex", mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: msg.sender === "나" ? "#1976d2" : "#eee", color: msg.sender === "나" ? "#fff" : "#222" }}>
                      {msg.sender === "나" ? "나" : "A"}
                    </Avatar>
                    <Paper sx={{ p: 2, bgcolor: "#fff", minWidth: 120, maxWidth: 600 }}>
                      <Typography sx={{ fontWeight: 500, color: "#222" }}>{msg.text}</Typography>
                      <Typography variant="caption" sx={{ color: "#888" }}>{msg.time}</Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Box>
              {/* 입력창 */}
              <Divider />
              <Box sx={{ display: "flex", alignItems: "center", p: 2, bgcolor: "#fafbfc" }}>
                <TextField
                  fullWidth
                  placeholder="메시지를 입력하세요..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  size="small"
                  sx={{ bgcolor: "#fff", borderRadius: 2 }}
                />
                <IconButton color="primary" onClick={handleSend} sx={{ ml: 1 }}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
          {/* 우측: 작업/워크플로우/에이전트 상태 */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 3, minHeight: 600, bgcolor: "#fafbfc" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>구매 프로세스 분석</Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: "#888" }}>작업 목록</Typography>
                <List dense>
                  {tasks.map((task, idx) => (
                    <ListItem key={task.id ?? idx} disablePadding sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={task.label}
                        color={task.done ? "success" : task.active ? "primary" : "default"}
                        variant={task.active ? "filled" : "outlined"}
                        sx={{ mr: 1, minWidth: 32 }}
                      />
                      {task.active && <Typography variant="body2" color="primary.main">●</Typography>}
                      {task.done && <Typography variant="body2" color="success.main">●</Typography>}
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ mb: 1, color: "#888" }}>활성 에이전트</Typography>
                <List dense>
                  {agents.map(agent => (
                    <ListItem key={agent.id} disablePadding sx={{ mb: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, mr: 1 }}>{agent.name[0]}</Avatar>
                      <Typography variant="body2" sx={{ flex: 1 }}>{agent.name}</Typography>
                      <Chip size="small" label={agent.status ?? "대기 중"} variant="outlined" />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}