# /workspace — Fabric items in Git-connected format

This folder is what the **Dev workspace** is Git-connected to. The Fabric
service writes/reads items here in its standard folder layout (one folder
per item, suffixed by item type).

> **Important**: do not hand-edit these files in PRs unless you know what you
> are doing. The expected workflow is:
>
> 1. Edit items inside the **Dev workspace UI** in Fabric.
> 2. Use **Commit to Git** from the workspace.
> 3. PR your branch into `dev`.
>
> The placeholder files below exist only so the repo and pipelines work
> end-to-end before the Dev workspace is connected. Once the workspace is
> connected and you commit real items, replace these stubs.

## Items in scope (demo)

| Folder                        | Item type      |
|-------------------------------|----------------|
| `Sales.Notebook/`             | Notebook       |
| `Ingest.DataPipeline/`        | DataPipeline   |
| `Bronze.Lakehouse/`           | Lakehouse      |
| `Silver.Warehouse/`           | Warehouse      |
| `Sales.SemanticModel/`        | SemanticModel  |
| `Sales.Report/`               | Report         |
| `Telemetry.Eventhouse/`       | Eventhouse     |
| `CleanCustomers.Dataflow/`    | Dataflow Gen2  |
