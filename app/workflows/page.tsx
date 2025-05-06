'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  AppBar, Toolbar, Typography, Button, Container, Box, TextField, Paper, Grid, Tabs, Tab, List, ListItem, ListItemText, IconButton,
  Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { TreeView, TreeItem } from '@mui/lab';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import AgentDetailForm from "../components/AgentDetailForm";

// --- 디폴트 데이터 (처음엔 백엔드에 없을 수 있으니 프론트에서 임시로 추가) ---
const DEFAULT_BRANDS = [
  {
    id: "julgap",
    name: "줄갭",
    teams: [
      {
        id: "team1",
        name: "경영지원팀",
        agents: [
          { id: "agent1", name: "팀장 에이전트" },
          { id: "agent2", name: "구매담당자" }
        ]
      }
    ]
  }
];

type NodeType = 'input' | 'leader' | 'worker' | 'output';

type WorkflowNode = {
  id: string;
  type: NodeType;
  label: string;
  agentName?: string;
  model?: string;
  ragDocs?: string[];
  prompt?: string;
  description?: string;
  temperature?: number;
};

type Agent = { id: string; name: string };

type Team = { id: string; name: string; parentId?: string; role?: string; description?: string; prompt?: string; brandId: string; agents?: Agent[] };

export default function WorkflowEditor() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("julgap");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editTeamRole, setEditTeamRole] = useState('');
  const [editTeamParentId, setEditTeamParentId] = useState<string | null>(null);

  const [teamTab, setTeamTab] = useState(0);
  const [teamDetail, setTeamDetail] = useState<Partial<Team>>({});

  // 워크플로우 관리
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<[string, string][]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [selectedWorkflowIdx, setSelectedWorkflowIdx] = useState<number | null>(null);

  // 실제 데이터는 백엔드에서 받아옴
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("julgap");

  // 팀 목록 불러오기 (brandId: "julgap"만)
  const fetchTeams = async () => {
    const res = await fetch('/api/teams');
    if (res.ok) {
      const data = await res.json();
      const julgapTeams = data.filter((t: Team) => t.brandId === "julgap");
      setTeams(julgapTeams);
      // 줄갭 하위 팀이 없으면 selectedTeamId는 "julgap" 유지
      if (selectedTeamId !== "julgap" && !julgapTeams.find((t: Team) => t.id === selectedTeamId)) {
        setSelectedTeamId("julgap");
      }
    }
  };
  useEffect(() => { fetchTeams(); }, []);

  // --- 백엔드 연동: 브랜드/팀/에이전트 트리 불러오기 ---
  const fetchOrgTree = async () => {
    // 예시: /api/org-tree에서 브랜드-팀-에이전트 트리 구조로 반환
    const res = await fetch('/api/org-tree');
    if (res.ok) {
      const data = await res.json();
      setBrands(data.length > 0 ? data : DEFAULT_BRANDS);
    } else {
      setBrands(DEFAULT_BRANDS);
    }
  };
  useEffect(() => { fetchOrgTree(); }, []);

  // 팀 추가/수정 다이얼로그 열기
  const openTeamDialog = (team?: Team, parentId?: string) => {
    if (team) {
      setEditTeamId(team.id);
      setEditTeamName(team.name);
      setEditTeamRole(team.role || '');
      setEditTeamParentId(team.parentId || null);
    } else {
      setEditTeamId(null);
      setEditTeamName('');
      setEditTeamRole('');
      setEditTeamParentId(parentId ?? "julgap");
    }
    setTeamDialogOpen(true);
  };

  // 팀 추가/수정 저장 (brandId: "julgap" 반드시 포함)
  const handleTeamSave = async () => {
    if (!editTeamName.trim()) return;
    if (editTeamId) {
      await fetch(`/api/teams/${editTeamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName,
          role: editTeamRole,
          parentId: editTeamParentId,
          brandId: "julgap"
        }),
      });
    } else {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName,
          role: editTeamRole,
          parentId: editTeamParentId ?? "julgap",
          brandId: "julgap"
        }),
      });
    }
    setTeamDialogOpen(false);
    setEditTeamId(null);
    setEditTeamName('');
    setEditTeamRole('');
    setEditTeamParentId(null);
    fetchTeams();
  };

  // 팀 선택 시 상세 정보 불러오기
  useEffect(() => {
    if (!selectedTeamId) return;
    if (selectedTeamId === "julgap") {
      setTeamDetail({
        name: "줄갭",
        description: "줄갭은(는) AI 기반 업무 자동화 솔루션을 제공하는 기업입니다.",
        prompt: "당신은 줄갭의 AI 에이전트입니다. 회사의 가치와 목표에 맞게 행동해야 합니다."
      });
    } else {
      const team = teams.find(t => t.id === selectedTeamId);
      setTeamDetail(team ? { ...team } : {});
    }
  }, [selectedTeamId, teams]);

  // 팀 상세 저장 (줄갭은 저장 불가)
  const handleTeamDetailSave = async () => {
    if (!selectedTeamId || selectedTeamId === "julgap") return;
    const res = await fetch(`/api/teams/${selectedTeamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: teamDetail.name,
        description: teamDetail.description,
        prompt: teamDetail.prompt,
        role: teamDetail.role,
      }),
    });
    if (res.ok) {
      fetchTeams();
      alert("저장 완료!");
    } else {
      alert("저장 실패");
    }
  };

  // 워크플로우 불러오기 (팀별)
  useEffect(() => {
    if (selectedTeamId && selectedTeamId !== "julgap") fetchWorkflows(selectedTeamId);
    else {
      setSavedWorkflows([]);
      setNodes([]);
      setEdges([]);
      setWorkflowName('');
      setSelectedWorkflowIdx(null);
    }
  }, [selectedTeamId]);
  const fetchWorkflows = async (teamId: string) => {
    const res = await fetch(`/api/workflows?teamId=${teamId}`);
    if (res.ok) {
      const data = await res.json();
      setSavedWorkflows(data);
      if (data.length > 0) {
        setNodes(data[0].nodes);
        setEdges(data[0].edges);
        setWorkflowName(data[0].name);
        setSelectedWorkflowIdx(0);
      } else {
        setNodes([
          { id: '1', type: 'input', label: '사용자 입력' },
          { id: '2', type: 'leader', label: '팀장 에이전트', agentName: '팀장', model: 'GPT-4o', ragDocs: [], prompt: '' },
          { id: '3', type: 'worker', label: '구매담당자', agentName: '구매담당자', model: 'Claude-3', ragDocs: [], prompt: '' },
          { id: '4', type: 'output', label: '최종 응답' },
        ]);
        setEdges([['1', '2'], ['2', '3'], ['3', '4']]);
        setWorkflowName('');
        setSelectedWorkflowIdx(null);
      }
      setSelectedNodeId(null);
    }
  };

  // 워크플로우 저장/삭제/불러오기/노드 추가 등 기존 코드 동일...
  const saveWorkflow = () => { /* 워크플로우 저장 로직 구현 */ };
  const loadWorkflow = (idx: number) => { /* 워크플로우 불러오기 로직 구현 */ };
  const deleteWorkflow = (id: string) => { /* 워크플로우 삭제 로직 구현 */ };
  const addWorker = () => { /* 워커 에이전트 추가 로직 구현 */ };

  // react-flow 변환 함수
  const toRFNodes = (nodes: WorkflowNode[]): Node[] =>
    nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: { x: 100, y: 100 },
      data: { ...n },
      label: n.label,
    }));
  const toRFEdges = (edges: [string, string][]): Edge[] =>
    edges.map(([source, target], idx) => ({
      id: `e${source}-${target}-${idx}`,
      source,
      target,
      type: 'default',
    }));

  const rfNodes = toRFNodes(nodes);
  const rfEdges = toRFEdges(edges);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const updateNode = (key: keyof WorkflowNode, value: any) => {
    if (!selectedNodeId) return;
    setNodes(nodes =>
      nodes.map(n =>
        n.id === selectedNodeId ? { ...n, [key]: value } : n
      )
    );
  };
  const deleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(nodes => nodes.filter(n => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>워크플로우 에디터</Typography>
        </Toolbar>
      </AppBar>

      <Grid container spacing={3}>
        {/* 1. 조직구조 */}
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight="bold" gutterBottom>조직 구조</Typography>
            <TreeView
              defaultCollapseIcon={<span>-</span>}
              defaultExpandIcon={<span>+</span>}
              selected={selectedTeamId}
              sx={{ minHeight: 300 }}
            >
              {brands.map((brand: any) => (
                <TreeItem
                  key={brand.id}
                  nodeId={brand.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ flex: 1, fontWeight: 600 }}>
                        <span role="img" aria-label="brand">🏢</span> {brand.name}
                      </span>
                      <IconButton
                        size="small"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // openTeamDialog(undefined, brand.id);
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  onClick={() => { setSelectedBrandId(brand.id); setSelectedTeamId(""); }}
                >
                  {/* 팀 목록 */}
                  {brand.teams && brand.teams.map((team: any) => (
                    <TreeItem
                      key={team.id}
                      nodeId={team.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ flex: 1 }}>
                            <span role="img" aria-label="team">👥</span> {team.name}
                          </span>
                        </Box>
                      }
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedTeamId(team.id); }}
                    >
                      {/* 에이전트 목록 */}
                      {team.agents && team.agents.map((agent: any) => (
                        <TreeItem
                          key={agent.id}
                          nodeId={agent.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                              <span style={{ flex: 1 }}>
                                <span role="img" aria-label="agent">🤖</span> {agent.name}
                              </span>
                            </Box>
                          }
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); /* setSelectedAgentId(agent.id); */ }}
                        />
                      ))}
                    </TreeItem>
                  ))}
                </TreeItem>
              ))}
            </TreeView>
          </Paper>
        </Grid>

        {/* 2. 상세설명 (줄갭/팀 상세) */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {selectedTeamId === "julgap" ? (
              <>
                <Typography variant="h6" fontWeight="bold" gutterBottom>줄갭</Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  줄갭은(는) AI 기반 업무 자동화 솔루션을 제공하는 기업입니다.
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
                  당신은 줄갭의 AI 에이전트입니다. 회사의 가치와 목표에 맞게 행동해야 합니다.
                </Typography>
              </>
            ) : (
              <>
                {/* 상단 팀명/설명/프롬프트 */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {teamDetail.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {teamDetail.description}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
                  {teamDetail.prompt}
                </Typography>
                {/* 상단 버튼 */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button variant="outlined" size="small" startIcon={<UploadFileIcon />}>문서 업로드</Button>
                  <Button variant="outlined" size="small" startIcon={<StorageIcon />}>데이터베이스 연결</Button>
                </Box>
                {/* 탭 */}
                <Tabs value={teamTab} onChange={(_, v) => setTeamTab(v)} sx={{ mb: 2 }}>
                  <Tab label="기본 정보" />
                  <Tab label="RAG 문서" />
                  <Tab label="데이터베이스" />
                  <Tab label="설정" />
                </Tabs>
                {teamTab === 0 && (
                  <Box>
                    <TextField
                      label="이름"
                      value={teamDetail.name || ""}
                      onChange={e => setTeamDetail(d => ({ ...d, name: e.target.value }))}
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      label="설명"
                      value={teamDetail.description || ""}
                      onChange={e => setTeamDetail(d => ({ ...d, description: e.target.value }))}
                      fullWidth
                      margin="normal"
                      multiline
                      minRows={2}
                    />
                    <TextField
                      label="프롬프트"
                      value={teamDetail.prompt || ""}
                      onChange={e => setTeamDetail(d => ({ ...d, prompt: e.target.value }))}
                      fullWidth
                      margin="normal"
                      multiline
                      minRows={2}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handleTeamDetailSave}
                    >
                      저장
                    </Button>
                  </Box>
                )}
                {teamTab === 1 && (
                  <Box>
                    <Typography>RAG 문서 탭 (추후 개발)</Typography>
                  </Box>
                )}
                {teamTab === 2 && (
                  <Box>
                    <Typography>데이터베이스 탭 (추후 개발)</Typography>
                  </Box>
                )}
                {teamTab === 3 && (
                  <Box>
                    <Typography>설정 탭 (추후 개발)</Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* 3. 워크플로우 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <TextField
                label="워크플로우 이름"
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                size="small"
                sx={{ width: 200 }}
              />
              <Button variant="contained" color="success" onClick={saveWorkflow}>저장</Button>
              {savedWorkflows.length > 0 && (
                <>
                  <Select
                    value={selectedWorkflowIdx ?? ''}
                    onChange={e => loadWorkflow(Number(e.target.value))}
                    size="small"
                    displayEmpty
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="">워크플로우 불러오기</MenuItem>
                    {savedWorkflows.map((wf, idx) => (
                      <MenuItem value={idx} key={wf.id || wf.name + idx}>{wf.name}</MenuItem>
                    ))}
                  </Select>
                  {selectedWorkflowIdx !== null && savedWorkflows[selectedWorkflowIdx] && (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => deleteWorkflow(savedWorkflows[selectedWorkflowIdx].id)}
                    >
                      워크플로우 삭제
                    </Button>
                  )}
                </>
              )}
            </Box>
            <Box sx={{ height: 400, background: "#fff", borderRadius: 2, mb: 2 }}>
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                fitView
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={addWorker}
            >
              + 워커 에이전트 추가
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* 팀 추가/수정 팝업 */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)}>
        <DialogTitle>{editTeamId ? "팀 수정" : "팀 추가"}</DialogTitle>
        <DialogContent>
          <TextField
            label="팀명"
            value={editTeamName}
            onChange={e => setEditTeamName(e.target.value)}
            fullWidth
            margin="dense"
            sx={{ mb: 2 }}
          />
          <TextField
            label="팀 역할"
            value={editTeamRole}
            onChange={e => setEditTeamRole(e.target.value)}
            fullWidth
            margin="dense"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleTeamSave}>
            {editTeamId ? "수정" : "추가"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}