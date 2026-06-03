// Builds docs/Fabric-CICD-Demo.pptx
const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.title = "Fabric CI/CD from GitHub — for AHSA";
pres.author = "Prepared for AHSA";
pres.company = "Prepared for AHSA";
pres.subject = "Microsoft Fabric CI/CD walkthrough — AHSA engineering team";

// Ocean Gradient palette
const C = {
  deep:    "065A82",
  teal:    "1C7293",
  midnight:"21295C",
  ice:     "E8F1F5",
  white:   "FFFFFF",
  text:    "1A1A2E",
  muted:   "566573",
  accent:  "F2A341",
  good:    "2EA86B",
  bad:     "C0392B",
};

const W = 13.3, H = 7.5;

function addFooter(slide, pageNum) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: H - 0.35, w: W, h: 0.35, fill: { color: C.midnight }, line: { color: C.midnight }
  });
  slide.addText("Fabric CI/CD from GitHub  ·  Prepared for AHSA", {
    x: 0.4, y: H - 0.35, w: 8, h: 0.35, fontSize: 10, color: C.ice, fontFace: "Segoe UI", valign: "middle"
  });
  slide.addText(String(pageNum), {
    x: W - 0.8, y: H - 0.35, w: 0.4, h: 0.35, fontSize: 10, color: C.ice, fontFace: "Segoe UI",
    align: "right", valign: "middle"
  });
}

function sideAccent(slide) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: H - 0.35, fill: { color: C.accent }, line: { color: C.accent }
  });
}

function titleBlock(slide, eyebrow, title) {
  slide.addText(eyebrow.toUpperCase(), {
    x: 0.6, y: 0.45, w: 12, h: 0.35, fontSize: 11, bold: true,
    color: C.teal, fontFace: "Segoe UI", charSpacing: 4
  });
  slide.addText(title, {
    x: 0.6, y: 0.8, w: 12, h: 0.9, fontSize: 32, bold: true,
    color: C.midnight, fontFace: "Segoe UI"
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.6, y: 1.75, w: 1.2, h: 0, line: { color: C.accent, width: 3 }
  });
}

let page = 0;

// ---------- Slide 1: Title ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.midnight };
  // accent strip
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.6, fill: { color: C.deep }, line: { color: C.deep }});
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.6, w: W, h: 0.6, fill: { color: C.deep }, line: { color: C.deep }});
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.0, w: 1.5, h: 0.08, fill: { color: C.accent }, line: { color: C.accent }});
  s.addText("PREPARED FOR  ·  AHSA ENGINEERING", {
    x: 0.6, y: 2.2, w: 12, h: 0.6, fontSize: 16, bold: true, color: C.accent,
    fontFace: "Segoe UI", charSpacing: 6
  });
  s.addText("Fabric CI/CD from GitHub", {
    x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 44, bold: true, color: C.white, fontFace: "Segoe UI"
  });
  s.addText("A best-practice path to Dev / Test / Prod for the AHSA data team", {
    x: 0.6, y: 4.3, w: 12, h: 0.6, fontSize: 22, color: C.ice, fontFace: "Segoe UI", italic: true
  });
  s.addText("Microsoft Fabric  ·  GitHub Actions  ·  fabric-cicd  ·  OIDC workload identity", {
    x: 0.6, y: 5.2, w: 12, h: 0.5, fontSize: 16, color: C.ice, fontFace: "Segoe UI"
  });
  s.addText("60-minute walkthrough  ·  AHSA engineering team", {
    x: 0.6, y: 6.3, w: 12, h: 0.4, fontSize: 14, color: C.ice, fontFace: "Segoe UI"
  });
  s.addNotes(
    "Open with the customer name on screen. Set the tone:\n\n" +
    "\"Good morning AHSA team — thanks for the time. Over the next hour we are going to walk through how AHSA can ship changes to Microsoft Fabric the same way you ship code: through GitHub pull requests, with reviews and approvals.\"\n\n" +
    "Frame the story: today AHSA's analytics work probably lives in workspace UIs, with limited review and limited rollback. By the end of this session, you will have seen exactly what 'CI/CD for Fabric' looks like for AHSA — a change that starts as a notebook edit, gets reviewed in a PR, auto-deploys to Test, and promotes to Prod with a manual approval the other engineer signs off.\n\n" +
    "Audience check: this is built for AHSA's 2-engineer data team — small enough that 4-eyes review really matters, large enough that workspace collisions hurt."
  );
}

// ---------- Slide 2: Why ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "The problem at AHSA today", "Why CI/CD for Fabric — and why GitHub?");

  const cards = [
    { h: "No drift", b: "Today AHSA's Test and Prod workspaces can be edited directly. From here on, they only change via reviewed PRs." },
    { h: "4-eyes review", b: "With AHSA's 2-engineer team, mandatory peer review on every change is non-negotiable. CODEOWNERS enforces it." },
    { h: "No secrets", b: "GitHub OIDC → Entra federated credential. Zero client secrets sitting in AHSA's repo or pipelines." },
    { h: "Reversible", b: "Every AHSA change is a Git commit. Rollback = revert merge → the pipeline restores the previous state." },
  ];
  const cardW = 2.95, cardH = 3.6, gap = 0.2, startX = 0.6, startY = 2.2;
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: C.ice }, line: { color: C.ice },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 90, opacity: 0.08 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: 0.18, fill: { color: C.accent }, line: { color: C.accent }
    });
    s.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.25, y: startY + 0.35, w: 1, h: 0.6, fontSize: 36, bold: true,
      color: C.teal, fontFace: "Segoe UI"
    });
    s.addText(c.h, {
      x: x + 0.25, y: startY + 1.1, w: cardW - 0.5, h: 0.7, fontSize: 22, bold: true,
      color: C.midnight, fontFace: "Segoe UI"
    });
    s.addText(c.b, {
      x: x + 0.25, y: startY + 1.85, w: cardW - 0.5, h: 1.6, fontSize: 13,
      color: C.text, fontFace: "Segoe UI"
    });
  });
  s.addNotes(
    "Tell the AHSA story directly. Four reasons this matters here:\n\n" +
    "1. No drift — today, anyone with access to AHSA's Fabric workspaces can change Test or Prod directly. After this, higher environments only change through a reviewed PR. The workspace stops being a place where 'someone fixed it last Tuesday and we don't know what'.\n\n" +
    "2. 4-eyes review — AHSA has 2 engineers. The risk of one person shipping a bad change without a second pair of eyes is real. Branch protection + CODEOWNERS forces the other AHSA engineer to review every change.\n\n" +
    "3. No secrets — GitHub OIDC + an Entra federated credential. There is literally no client secret stored anywhere in AHSA's repo. If the repo leaks tomorrow, no credential leaks.\n\n" +
    "4. Reversible — every change is a Git commit. Rolling back AHSA's Prod is just 'git revert' — the pipeline re-runs and restores the previous state. No midnight click-ops.\n\n" +
    "Frame this as: 'we are bringing the same software-engineering hygiene AHSA already uses for application code to your data and analytics work'."
  );
  addFooter(s, page);
}

// ---------- Slide 3: Architecture ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Architecture for AHSA", "Three workspaces, one shared capacity");

  // Table
  const headerOpts = { fill: { color: C.midnight }, color: C.white, bold: true,
    fontSize: 14, fontFace: "Segoe UI", align: "left", valign: "middle" };
  const cellOpts = { fill: { color: C.ice }, color: C.text, fontSize: 13,
    fontFace: "Segoe UI", align: "left", valign: "middle" };
  const cellAlt  = { fill: { color: C.white }, color: C.text, fontSize: 13,
    fontFace: "Segoe UI", align: "left", valign: "middle" };

  const rows = [
    [{ text: "Workspace", options: headerOpts },
     { text: "Git-connected?", options: headerOpts },
     { text: "Promotion mechanism", options: headerOpts }],
    [{ text: "Dev  (ahsa-fabric-dev)", options: { ...cellOpts, bold: true } },
     { text: "Yes — `dev` branch", options: cellOpts },
     { text: "AHSA devs commit / Update from Git in Fabric UI", options: cellOpts }],
    [{ text: "Test (ahsa-fabric-test)", options: { ...cellAlt, bold: true } },
     { text: "No", options: cellAlt },
     { text: "GitHub Actions runs fabric-cicd on merge to `test`", options: cellAlt }],
    [{ text: "Prod (ahsa-fabric-prod)", options: { ...cellOpts, bold: true } },
     { text: "No", options: cellOpts },
     { text: "GitHub Actions on merge to `main` — gated by AHSA reviewer", options: cellOpts }],
  ];
  s.addTable(rows, {
    x: 0.6, y: 2.2, w: 12.1, colW: [2.7, 3.0, 6.4],
    rowH: 0.7, border: { type: "none" }
  });

  // Bottom callouts
  const caps = [
    { h: "Auth", b: "AHSA's GitHub repo → OIDC → Entra SP (Workspace Admin on Test + Prod)" },
    { h: "Capacity", b: "One shared F-SKU capacity for all 3 AHSA workspaces — simple cost story" },
    { h: "Per-dev isolation", b: "Optional: each AHSA engineer gets a private feature workspace" },
  ];
  caps.forEach((c, i) => {
    const x = 0.6 + i * 4.05, y = 5.5;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 3.85, h: 1.4, fill: { color: C.white }, line: { color: C.teal, width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.12, h: 1.4, fill: { color: C.accent }, line: { color: C.accent }
    });
    s.addText(c.h, { x: x + 0.25, y: y + 0.1, w: 3.5, h: 0.4, fontSize: 14, bold: true,
      color: C.midnight, fontFace: "Segoe UI" });
    s.addText(c.b, { x: x + 0.25, y: y + 0.5, w: 3.5, h: 0.85, fontSize: 11,
      color: C.text, fontFace: "Segoe UI" });
  });
  s.addNotes(
    "This is the AHSA target state. Three workspaces, one capacity. The key insight is the middle column — only Dev is Git-connected.\n\n" +
    "ahsa-fabric-dev is where AHSA engineers work. They edit notebooks and pipelines in the Fabric UI, and the workspace itself commits those changes to the dev branch. So 'save in Fabric' = 'commit to AHSA's GitHub'.\n\n" +
    "ahsa-fabric-test and ahsa-fabric-prod are NOT Git-connected. They are updated by code — a GitHub Actions workflow that runs the fabric-cicd library. This is deliberate: if Test or Prod were Git-connected too, anyone at AHSA could 'Update from Git' and bypass the review gate. Code-deployed environments cannot be changed except through a merged PR.\n\n" +
    "Auth: a single AHSA Service Principal acts as Workspace Admin on Test and Prod. GitHub Actions assumes that SP via OIDC. No secrets stored.\n\n" +
    "Capacity: all three AHSA workspaces share one F-SKU capacity to keep cost predictable.\n\n" +
    "This is the recommended Fabric pattern, not something we invented for AHSA — we are aligning AHSA to it."
  );
  addFooter(s, page);
}

// ---------- Slide 4: Branch flow ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Promotion flow", "How a change moves through AHSA's environments");

  const stages = [
    { t: "feature/*", sub: "AHSA dev branch", color: C.muted, ws: "(per-dev workspace, optional)" },
    { t: "dev",       sub: "PR + AHSA review",      color: C.teal,  ws: "ahsa-fabric-dev · Git-connected" },
    { t: "test",      sub: "PR merge",      color: C.deep,  ws: "ahsa-fabric-test · fabric-cicd" },
    { t: "main",      sub: "PR + AHSA approval", color: C.midnight, ws: "ahsa-fabric-prod · gated, 4-eyes" },
  ];
  const boxW = 2.7, boxH = 1.6, startX = 0.6, startY = 2.5, gap = 0.45;
  stages.forEach((st, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: startY, w: boxW, h: boxH,
      fill: { color: st.color }, line: { color: st.color }, rectRadius: 0.08,
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.15 }
    });
    s.addText(st.t, { x, y: startY + 0.2, w: boxW, h: 0.6, fontSize: 22, bold: true,
      color: C.white, fontFace: "Consolas", align: "center" });
    s.addText(st.sub, { x, y: startY + 0.85, w: boxW, h: 0.4, fontSize: 12,
      color: C.ice, fontFace: "Segoe UI", align: "center", italic: true });
    s.addText(st.ws, {
      x: x - 0.1, y: startY + boxH + 0.25, w: boxW + 0.2, h: 0.7, fontSize: 11,
      color: C.text, fontFace: "Segoe UI", align: "center"
    });
    if (i < stages.length - 1) {
      const ax = x + boxW + 0.05, ay = startY + boxH / 2;
      s.addShape(pres.shapes.RIGHT_TRIANGLE, {
        x: ax, y: ay - 0.15, w: 0.35, h: 0.3,
        fill: { color: C.accent }, line: { color: C.accent }, rotate: 90
      });
    }
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 6.0, w: 12.1, h: 0.9, fill: { color: C.ice }, line: { color: C.ice }
  });
  s.addText([
    { text: "Trunk-based · ", options: { bold: true, color: C.midnight } },
    { text: "short-lived feature branches · ", options: { color: C.text } },
    { text: "branch protection on dev/test/main · ", options: { color: C.text } },
    { text: "CODEOWNERS enforces review", options: { color: C.text } },
  ], { x: 0.8, y: 6.0, w: 11.7, h: 0.9, fontSize: 13, fontFace: "Segoe UI", valign: "middle" });

  s.addNotes(
    "Read this left to right — it is the path every AHSA change takes, from idea to Prod.\n\n" +
    "feature/* → the AHSA engineer's working branch. Optionally tied to a private dev workspace.\n\n" +
    "dev → the merge target for features. Backed by ahsa-fabric-dev. PR review gate #1 — the other AHSA engineer signs off.\n\n" +
    "test → merging dev → test triggers the Test deployment workflow into ahsa-fabric-test. Automatic, no human approval needed because it is non-prod.\n\n" +
    "main → merging test → main triggers the Prod deployment workflow into ahsa-fabric-prod, which pauses for a manual approval from the OTHER AHSA engineer (4-eyes).\n\n" +
    "Branches are gated by branch protection rules; merges require passing checks and a CODEOWNERS review. Nothing skips the pipeline.\n\n" +
    "Key phrase to drop: 'for AHSA, the branch is the source of truth for the environment'."
  );
  addFooter(s, page);
}

// ---------- Slide 5: Auth (no secrets) ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Authentication", "AHSA's GitHub → Entra → Fabric. No secrets.");

  // Left: flow
  const nodes = [
    { t: "AHSA GitHub Actions",  sub: "issues OIDC token from AHSA's repo" },
    { t: "AHSA Entra App reg",   sub: "sp-ahsa-fabric-cicd · federated credential" },
    { t: "AHSA Fabric Workspace",sub: "SP is Workspace Admin (Test + Prod)" },
  ];
  const nx = 0.6, nw = 6.3;
  nodes.forEach((n, i) => {
    const ny = 2.4 + i * 1.5;
    s.addShape(pres.shapes.RECTANGLE, {
      x: nx, y: ny, w: nw, h: 1.1,
      fill: { color: C.white }, line: { color: C.teal, width: 1.5 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: nx + 0.2, y: ny + 0.25, w: 0.6, h: 0.6,
      fill: { color: C.deep }, line: { color: C.deep }
    });
    s.addText(String(i + 1), { x: nx + 0.2, y: ny + 0.25, w: 0.6, h: 0.6,
      fontSize: 22, bold: true, color: C.white, fontFace: "Segoe UI", align: "center", valign: "middle" });
    s.addText(n.t, { x: nx + 1.0, y: ny + 0.15, w: nw - 1.2, h: 0.45,
      fontSize: 18, bold: true, color: C.midnight, fontFace: "Segoe UI" });
    s.addText(n.sub, { x: nx + 1.0, y: ny + 0.6, w: nw - 1.2, h: 0.4,
      fontSize: 12, color: C.muted, fontFace: "Segoe UI" });
    if (i < nodes.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: nx + nw / 2, y: ny + 1.1, w: 0, h: 0.4,
        line: { color: C.accent, width: 3, endArrowType: "triangle" }
      });
    }
  });

  // Right: callout box
  const rx = 7.3, ry = 2.4, rw = 5.4, rh = 4.5;
  s.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: ry, w: rw, h: rh, fill: { color: C.midnight }, line: { color: C.midnight }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: ry, w: rw, h: 0.15, fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("Federated credential subjects", {
    x: rx + 0.3, y: ry + 0.3, w: rw - 0.6, h: 0.5, fontSize: 18, bold: true,
    color: C.white, fontFace: "Segoe UI"
  });
  s.addText([
    { text: "repo:AHSA/...:ref:refs/heads/test",       options: { breakLine: true, color: C.ice, fontSize: 13, fontFace: "Consolas" } },
    { text: "repo:AHSA/...:environment:test",          options: { breakLine: true, color: C.ice, fontSize: 13, fontFace: "Consolas" } },
    { text: "repo:AHSA/...:environment:prod",          options: { color: C.ice, fontSize: 13, fontFace: "Consolas" } },
  ], { x: rx + 0.3, y: ry + 1.0, w: rw - 0.6, h: 1.4 });

  s.addText("Repo variables (no secrets)", {
    x: rx + 0.3, y: ry + 2.5, w: rw - 0.6, h: 0.5, fontSize: 16, bold: true,
    color: C.accent, fontFace: "Segoe UI"
  });
  s.addText([
    { text: "AZURE_TENANT_ID · AZURE_CLIENT_ID",                      options: { breakLine: true, color: C.ice, fontSize: 12, fontFace: "Consolas" } },
    { text: "FABRIC_CAPACITY_ID",                                     options: { breakLine: true, color: C.ice, fontSize: 12, fontFace: "Consolas" } },
    { text: "WORKSPACE_ID_TEST · WORKSPACE_ID_PROD",                  options: { color: C.ice, fontSize: 12, fontFace: "Consolas" } },
  ], { x: rx + 0.3, y: ry + 3.05, w: rw - 0.6, h: 1.3 });

  s.addNotes(
    "This is the part that should reassure AHSA's security team. There are no client secrets anywhere in this system.\n\n" +
    "How it works in three steps:\n" +
    "1. When an AHSA workflow runs, GitHub mints a short-lived OIDC token that describes exactly which repo, branch, and environment is running.\n" +
    "2. AHSA's Entra tenant is configured to TRUST tokens that match a specific 'subject' — for example, 'a workflow running in the AHSA repo, in the prod environment'. That trust is the federated credential.\n" +
    "3. If the subject matches, Entra issues an Azure access token for sp-ahsa-fabric-cicd. That SP is Workspace Admin on AHSA's Test and Prod workspaces, so the workflow can call Fabric APIs.\n\n" +
    "On the right are the three federated subjects we configure for AHSA — one per branch/environment. The only things stored in AHSA's GitHub are non-secret variables: tenant id, client id, capacity id, workspace ids.\n\n" +
    "If someone clones AHSA's repo tomorrow, they get nothing usable. That is the win."
  );
  addFooter(s, page);
}

// ---------- Slide 6: Repo layout ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "AHSA repo layout", "Fabric items as folders, parameterized rebinds");

  // Tree on left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 2.2, w: 6.0, h: 4.7, fill: { color: C.midnight }, line: { color: C.midnight }
  });
  const tree =
`.github/
  workflows/
    pr-validate.yml      # lint + dry-run on PRs
    deploy-test.yml      # merge to test → Test ws
    deploy-prod.yml      # merge to main → Prod ws (gated)
  CODEOWNERS             # 4-eyes review
workspace/               # Fabric items (Git-connected)
  Sales.Notebook/
  Ingest.DataPipeline/
  Bronze.Lakehouse/  Silver.Warehouse/
  Sales.SemanticModel/  Sales.Report/
  Telemetry.Eventhouse/  CleanCustomers.Dataflow/
  parameter.yml          # per-env rebinds
scripts/
  deploy.py              # fabric_cicd wrapper
  smoke_test.py
requirements.txt`;
  s.addText(tree, {
    x: 0.8, y: 2.35, w: 5.7, h: 4.4, fontSize: 11.5,
    color: C.ice, fontFace: "Consolas", valign: "top"
  });

  // Right: highlights
  const highlights = [
    { h: "workspace/parameter.yml", b: "Lives next to items so fabric-cicd auto-loads it. Holds connection IDs, lakehouse refs, capacity IDs per env." },
    { h: "deploy.py", b: "Thin wrapper around fabric_cicd.FabricWorkspace with unpublish_orphaned_items=True to prevent drift." },
    { h: "pr-validate.yml", b: "Lint + parameter schema check + fabric-cicd dry-run. Red = cannot merge." },
    { h: "CODEOWNERS", b: "Forces the other engineer to review — critical with a 2-person team." },
  ];
  highlights.forEach((h, i) => {
    const y = 2.2 + i * 1.2;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.9, y, w: 5.8, h: 1.05, fill: { color: C.ice }, line: { color: C.ice }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.9, y, w: 0.1, h: 1.05, fill: { color: C.accent }, line: { color: C.accent }
    });
    s.addText(h.h, { x: 7.1, y: y + 0.08, w: 5.5, h: 0.4, fontSize: 14, bold: true,
      color: C.midnight, fontFace: "Consolas" });
    s.addText(h.b, { x: 7.1, y: y + 0.45, w: 5.5, h: 0.6, fontSize: 11,
      color: C.text, fontFace: "Segoe UI" });
  });

  s.addNotes(
    "Quick tour of what is in AHSA's repo so the demo flow makes sense.\n\n" +
    "workspace/ — every Fabric item (notebooks, pipelines, lakehouses, semantic models, reports) is a folder. This is the format Fabric Git integration produces. AHSA does not author this layout by hand.\n\n" +
    "workspace/parameter.yml — the most important file for AHSA. It says 'in Test, this connection id is X; in Prod, it is Y'. fabric-cicd reads it and rebinds environment-specific values during deployment. This is how one branch deploys cleanly to all of AHSA's environments.\n\n" +
    ".github/workflows/ — three pipelines: pr-validate (runs on every AHSA PR), deploy-test (runs on merge to test), deploy-prod (runs on merge to main, with approval).\n\n" +
    "CODEOWNERS — one line that says 'the other AHSA engineer must review'. Tiny file, huge effect.\n\n" +
    "deploy.py — a thin wrapper around fabric_cicd. The important flag is unpublish_orphaned_items=True, which deletes items from the target workspace if AHSA deleted them in Git. Without that, AHSA's environments slowly accumulate ghosts."
  );
  addFooter(s, page);
}

// ---------- Slide 7: Demo agenda ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Live walkthrough", "60-minute agenda for AHSA");

  const agenda = [
    ["0", "Pre-built setup tour",                       "5 min"],
    ["1", "Repo & workspace tour",                      "5 min"],
    ["2", "Inner loop A — shared Dev workspace",        "10 min"],
    ["3", "Inner loop B — per-dev workspace",           "10 min"],
    ["4", "Promote Dev → Test (auto on PR merge)",      "10 min"],
    ["5", "Promote Test → Prod (gated, 4-eyes)",        "10 min"],
    ["6", "Failure & rollback (revert merge)",          "5 min"],
    ["7", "Best-practice recap + Q&A",                  "5 min"],
  ];
  const startY = 2.2, rowH = 0.55;
  agenda.forEach((row, i) => {
    const y = startY + i * rowH;
    if (i % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.6, y, w: 12.1, h: rowH, fill: { color: C.ice }, line: { color: C.ice }
      });
    }
    s.addShape(pres.shapes.OVAL, {
      x: 0.85, y: y + 0.08, w: 0.4, h: 0.4, fill: { color: C.deep }, line: { color: C.deep }
    });
    s.addText(row[0], { x: 0.85, y: y + 0.08, w: 0.4, h: 0.4,
      fontSize: 14, bold: true, color: C.white, fontFace: "Segoe UI",
      align: "center", valign: "middle" });
    s.addText(row[1], { x: 1.5, y, w: 9.5, h: rowH, fontSize: 15,
      color: C.midnight, fontFace: "Segoe UI", valign: "middle" });
    s.addText(row[2], { x: 11, y, w: 1.7, h: rowH, fontSize: 14, bold: true,
      color: C.teal, fontFace: "Segoe UI", align: "right", valign: "middle" });
  });
  s.addNotes(
    "This is how we will spend the next 55 minutes with AHSA. Time-box each phase — it is easy to overrun on the inner loops.\n\n" +
    "Phase 0–1: orientation. Show AHSA's existing setup so people see this is real, not slideware.\n\n" +
    "Phase 2–3: the inner loop. Two approaches because team-size matters. Approach A is shared Dev; Approach B is per-developer workspace. We will show AHSA both so the team can pick.\n\n" +
    "Phase 4–5: the headline moment for AHSA. Merge a PR, watch GitHub Actions deploy to Test, then watch the Prod approval gate the other engineer must clear.\n\n" +
    "Phase 6: the part most demos skip. Show what happens when AHSA breaks something, and how to recover. Engineers care about this more than the happy path.\n\n" +
    "Phase 7: 12-item checklist for AHSA to take away. That is the slide they will photograph."
  );
  addFooter(s, page);
}

// ---------- Slide 8: Inner loop A vs B ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Inner loop options", "Approach A vs B — which fits AHSA today?");

  const cols = [
    {
      title: "A · Shared Dev workspace",
      sub: "Both AHSA devs work in ahsa-fabric-dev",
      pros: ["Cheaper (one workspace)", "Simpler setup for AHSA today", "Good while only one engineer is active"],
      cons: ["UI conflicts when both AHSA devs touch the same item", "Harder to demo isolated state"],
      color: C.deep,
    },
    {
      title: "B · Per-dev workspace",
      sub: "ahsa-fabric-dev-alice, …-bob",
      pros: ["No collisions — each AHSA dev owns a workspace", "Workspace tracks the feature branch", "Scales as AHSA's team grows"],
      cons: ["Extra capacity overhead", "More setup automation needed"],
      color: C.midnight,
    },
  ];
  const cw = 5.95, gap = 0.2;
  cols.forEach((col, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 4.7,
      fill: { color: C.ice }, line: { color: C.ice }});
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.9,
      fill: { color: col.color }, line: { color: col.color }});
    s.addText(col.title, { x: x + 0.3, y: y + 0.1, w: cw - 0.6, h: 0.45,
      fontSize: 18, bold: true, color: C.white, fontFace: "Segoe UI" });
    s.addText(col.sub, { x: x + 0.3, y: y + 0.5, w: cw - 0.6, h: 0.35,
      fontSize: 12, color: C.ice, italic: true, fontFace: "Segoe UI" });

    s.addText("Pros", { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 0.35,
      fontSize: 13, bold: true, color: C.good, fontFace: "Segoe UI" });
    s.addText(col.pros.map((p, j) => ({
      text: p, options: { bullet: true, breakLine: j < col.pros.length - 1 }
    })), { x: x + 0.3, y: y + 1.4, w: cw - 0.6, h: 1.7, fontSize: 12,
      color: C.text, fontFace: "Segoe UI" });

    s.addText("Cons", { x: x + 0.3, y: y + 3.2, w: cw - 0.6, h: 0.35,
      fontSize: 13, bold: true, color: C.bad, fontFace: "Segoe UI" });
    s.addText(col.cons.map((p, j) => ({
      text: p, options: { bullet: true, breakLine: j < col.cons.length - 1 }
    })), { x: x + 0.3, y: y + 3.55, w: cw - 0.6, h: 1.1, fontSize: 12,
      color: C.text, fontFace: "Segoe UI" });
  });
  s.addNotes(
    "There are two ways AHSA can organize the Dev workspace, and the right answer depends on team activity.\n\n" +
    "Approach A — shared Dev workspace: both AHSA engineers work in the same ahsa-fabric-dev. They use feature branches in Git, but they share the workspace UI. Cheaper and simpler. The risk: if both edit the same notebook at the same time, the second 'Update from Git' will conflict.\n\n" +
    "Approach B — per-developer workspace: each AHSA engineer gets their own workspace, Git-connected to their own feature branch. No collisions. But AHSA pays for extra workspaces, and you need automation to spin them up.\n\n" +
    "Recommendation for AHSA today: start with A while only one engineer is actively building. Switch to B the first time you hit a painful conflict — that signal is unmistakable.\n\n" +
    "Important: this choice is purely about the inner loop. AHSA's Test and Prod look identical either way."
  );
  addFooter(s, page);
}

// ---------- Slide 9: Promotion (Test + Prod) ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Promotion", "What happens when AHSA merges a PR");

  const cols = [
    { h: "Dev → Test (deploy-test.yml)", color: C.deep, items: [
      "OIDC token: AHSA GitHub → Azure → Fabric",
      "fabric-cicd publishes items to ahsa-fabric-test",
      "parameter.yml rebinds to AHSA Test values",
      "unpublish_orphaned_items removes deletes",
      "Smoke test: run Sales notebook in Test",
    ]},
    { h: "Test → Prod (deploy-prod.yml)", color: C.midnight, items: [
      "Pipeline pauses on Environment approval",
      "Other AHSA engineer approves (4-eyes)",
      "fabric-cicd publishes to ahsa-fabric-prod",
      "Smoke test runs against Prod",
      "Pipeline tags AHSA release on success",
    ]},
  ];
  const cw = 5.95, gap = 0.2;
  cols.forEach((col, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.7,
      fill: { color: col.color }, line: { color: col.color }});
    s.addText(col.h, { x: x + 0.3, y: y + 0.1, w: cw - 0.6, h: 0.5,
      fontSize: 17, bold: true, color: C.white, fontFace: "Segoe UI", valign: "middle" });

    col.items.forEach((it, j) => {
      const iy = y + 0.95 + j * 0.7;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.25, y: iy + 0.1, w: 0.4, h: 0.4,
        fill: { color: C.accent }, line: { color: C.accent }
      });
      s.addText(String(j + 1), { x: x + 0.25, y: iy + 0.1, w: 0.4, h: 0.4,
        fontSize: 13, bold: true, color: C.white, fontFace: "Segoe UI",
        align: "center", valign: "middle" });
      s.addText(it, { x: x + 0.8, y: iy + 0.05, w: cw - 1.0, h: 0.55,
        fontSize: 13, color: C.text, fontFace: "Segoe UI", valign: "middle" });
    });
  });
  s.addNotes(
    "What actually happens when AHSA merges a PR.\n\n" +
    "Dev → Test: the deploy-test workflow starts. It exchanges a GitHub OIDC token for an Azure token, then calls fabric-cicd. fabric-cicd walks workspace/, applies parameter.yml rebinds for AHSA's Test environment, and publishes every item to ahsa-fabric-test. Anything AHSA deleted from Git is also deleted in the workspace (orphan cleanup). Finally a smoke test runs the Sales notebook to confirm Test is healthy. No human in the loop.\n\n" +
    "Test → Prod: same workflow, but the job is bound to the GitHub 'prod' Environment, which has a required reviewer. The pipeline pauses; the OTHER AHSA engineer (not the one who opened the PR) approves; then it runs. After success it tags the commit so AHSA has a release marker.\n\n" +
    "That manual approval is AHSA's 4-eyes gate. It is the only thing standing between a merged PR and Prod, and it cannot be bypassed without admin intervention."
  );
  addFooter(s, page);
}

// ---------- Slide 10: Failure & rollback ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "Failure & rollback", "Two scenarios AHSA will hit — both end-to-end safe");

  const blocks = [
    { h: "A · CI catches a bad change", color: C.bad,
      body: "An AHSA engineer pushes a syntax error to a feature branch → PR opens → pr-validate goes red → branch protection blocks the merge. The bad change never reaches AHSA's Dev workspace.",
      label: "Prevention" },
    { h: "B · Roll AHSA Prod back", color: C.good,
      body: "git revert <merge-sha> on main → push → deploy-prod.yml runs again with the previous state → ahsa-fabric-prod restored. Same gated path; full audit trail.",
      label: "Recovery" },
  ];
  blocks.forEach((b, i) => {
    const y = 2.2 + i * 2.0;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 1.7,
      fill: { color: C.ice }, line: { color: C.ice }});
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 0.18, h: 1.7,
      fill: { color: b.color }, line: { color: b.color }});
    s.addText(b.label.toUpperCase(), {
      x: 1.0, y: y + 0.15, w: 3, h: 0.3, fontSize: 10, bold: true,
      color: b.color, fontFace: "Segoe UI", charSpacing: 4
    });
    s.addText(b.h, { x: 1.0, y: y + 0.4, w: 11.5, h: 0.5, fontSize: 20, bold: true,
      color: C.midnight, fontFace: "Segoe UI" });
    s.addText(b.body, { x: 1.0, y: y + 0.95, w: 11.5, h: 0.7, fontSize: 13,
      color: C.text, fontFace: "Segoe UI" });
  });

  // Caveat
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 6.3, w: 12.1, h: 0.8,
    fill: { color: C.midnight }, line: { color: C.midnight }});
  s.addText([
    { text: "Caveat: ", options: { bold: true, color: C.accent } },
    { text: "data is not in Git. Schema migrations need a forward-fix migration — reverting the code only restores definitions.",
      options: { color: C.ice } },
  ], { x: 0.85, y: 6.3, w: 11.6, h: 0.8, fontSize: 12, fontFace: "Segoe UI", valign: "middle" });

  s.addNotes(
    "Two scenarios for AHSA — both should feel boring, which is the whole point.\n\n" +
    "A — Prevention: an AHSA engineer pushes a broken notebook. pr-validate runs on the PR, fails, and branch protection blocks the merge. The bad change never leaves the feature branch. The cost of an AHSA mistake is a red check, not a Prod incident.\n\n" +
    "B — Recovery: a bad change DID make it to AHSA's Prod. To roll back, AHSA does not click anything in Fabric. The engineer reverts the merge commit on main with 'git revert', pushes, and the same deploy-prod workflow runs again — with the previous state — and restores ahsa-fabric-prod. Approval gate still applies, audit trail is preserved.\n\n" +
    "The caveat is honest and important for AHSA: code rolls back cleanly, data does not. If AHSA's change ran a destructive migration, reverting the code restores the schema definition but not the data. For those cases AHSA writes a forward-fix migration. We will not promise more than the tool delivers."
  );
  addFooter(s, page);
}

// ---------- Slide 11: Best-practice checklist ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.white };
  sideAccent(s);
  titleBlock(s, "AHSA takeaway", "Best-practice checklist");

  const items = [
    "Only Dev workspace is Git-connected; Test/Prod via fabric-cicd",
    "Trunk-based branches: feature → dev → test → main",
    "Branch protection + CODEOWNERS → enforced 4-eyes review",
    "GitHub Environments with required reviewers + history",
    "Workload identity (OIDC federated credential), no secrets",
    "SP is Workspace Admin on Test/Prod; tenant SP setting on",
    "Parameterize env-specific values in parameter.yml",
    "fabric-cicd unpublish_orphaned_items=True prevents drift",
    "Code & schema in Git; data is not in Git",
    "Pin fabric-cicd version; Dependabot for upgrades",
    "Post-deploy smoke test via Fabric REST",
    "Rollback = revert merge on main → pipeline restores state",
  ];
  const cols = 2, rows = 6, cellW = 6.05, cellH = 0.75;
  items.forEach((it, idx) => {
    const r = idx % rows, c = Math.floor(idx / rows);
    const x = 0.6 + c * (cellW + 0.1), y = 2.2 + r * cellH;
    s.addShape(pres.shapes.OVAL, {
      x: x, y: y + 0.12, w: 0.45, h: 0.45,
      fill: { color: C.deep }, line: { color: C.deep }
    });
    s.addText(String(idx + 1).padStart(2, "0"), {
      x: x, y: y + 0.12, w: 0.45, h: 0.45, fontSize: 11, bold: true,
      color: C.white, fontFace: "Segoe UI", align: "center", valign: "middle"
    });
    s.addText(it, { x: x + 0.6, y: y + 0.08, w: cellW - 0.7, h: cellH - 0.1,
      fontSize: 12.5, color: C.text, fontFace: "Segoe UI", valign: "middle" });
  });
  s.addNotes(
    "This is the photo slide for AHSA. Pause here.\n\n" +
    "If AHSA takes ONE thing away from today, it is the 12 items on this list. They are the difference between 'AHSA uses Git for Fabric' and 'AHSA has actual CI/CD for Fabric'.\n\n" +
    "Top half is the architecture pattern: only Dev is Git-connected, trunk-based branching, branch protection + CODEOWNERS + Environments, OIDC and no secrets, SP as Workspace Admin.\n\n" +
    "Bottom half is the operational hygiene AHSA should adopt: parameterize per env, prevent drift with orphan cleanup, keep code in Git but not data, pin and update fabric-cicd, smoke test after every deploy, and rollback by reverting the merge.\n\n" +
    "Walk through them in 60 seconds, then move to Q&A."
  );
  addFooter(s, page);
}

// ---------- Slide 12: Closing ----------
{
  page++;
  const s = pres.addSlide();
  s.background = { color: C.midnight };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.6,
    fill: { color: C.deep }, line: { color: C.deep }});
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.6, w: W, h: 0.6,
    fill: { color: C.deep }, line: { color: C.deep }});
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 1.5, h: 0.08,
    fill: { color: C.accent }, line: { color: C.accent }});
  s.addText("THANK YOU, AHSA", {
    x: 0.6, y: 2.7, w: 12, h: 0.7, fontSize: 16, bold: true, color: C.accent,
    fontFace: "Segoe UI", charSpacing: 6
  });
  s.addText("Questions?", {
    x: 0.6, y: 3.4, w: 12, h: 1.4, fontSize: 64, bold: true, color: C.white, fontFace: "Segoe UI"
  });
  s.addText("Reference repo: github.com/sundarambalasubramaniam/cicd-github-fabric-workspace-demo", {
    x: 0.6, y: 5.2, w: 12, h: 0.5, fontSize: 14, color: C.ice, fontFace: "Consolas"
  });
  s.addText("microsoft.github.io/fabric-cicd  ·  GitHub OIDC  ·  Microsoft Fabric Git integration", {
    x: 0.6, y: 5.8, w: 12, h: 0.5, fontSize: 14, color: C.ice, italic: true, fontFace: "Segoe UI"
  });
  s.addNotes(
    "Open Q&A with AHSA. Be ready for these:\n\n" +
    "Q: Why not Git-connect AHSA's Test and Prod too? — Because that bypasses the review gate. Higher environments must only change via merged PRs.\n\n" +
    "Q: Why not the built-in Fabric deployment pipelines? — They are click-ops. No PR review, no branch protection, no required approvers, no audit trail AHSA can query in GitHub.\n\n" +
    "Q: How does AHSA handle long-running data migrations? — Out of scope for this tool. Use versioned pipeline activities for data; use this for code and schema definitions.\n\n" +
    "Q: What about secrets in connections? — Fabric stores them. AHSA only rebinds connection IDs via parameter.yml. No secret material lives in Git.\n\n" +
    "Q: Item types not fully supported (Eventhouse/KQL, Dataflow Gen2)? — Check the fabric-cicd support matrix at demo time. The pattern still works for AHSA; coverage keeps expanding.\n\n" +
    "Close with: 'AHSA, the next step is a 1-week pilot — we wire one of your existing workspaces into this pattern and you keep working as normal.'"
  );
}

const out = path.resolve(__dirname, "Fabric-CICD-Demo.pptx");
pres.writeFile({ fileName: out }).then(f => console.log("Wrote:", f));
