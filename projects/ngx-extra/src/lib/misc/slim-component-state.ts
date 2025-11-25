import { signal, computed } from "@angular/core";
import { ManipulationMode } from "../types";

export function slimComponentState() {
  const isCheckBoxSelectionEnabled = signal<boolean>(false);
  const canSelectRow = signal<boolean>(false);
  const canSelectMultipleItem = signal<boolean>(false);
  const manipulationMode = signal<ManipulationMode | null>(null);
  const title = signal<string>("");
  const isAnyNetworkOperationRunning = signal<boolean>(false);
  const isDataManipulationUiActive = signal<boolean>(false);

  const manipulationModeLabel = computed(() => {
    switch (manipulationMode()) {
      case "create":
        return "Create";
      case "update":
        return "Update";
      case "delete":
        return "Delete";
      case "create-child":
        return "Create Child";
      case "update-child":
        return "Update Child";
      case "delete-child":
        return "Delete Child";
      default:
        return "";
    }
  });

  const titleWithManipulationMode = computed(() => {
    return `${manipulationModeLabel()} ${title()}`.trim();
  });

  return Object.seal({
    isCheckBoxSelectionEnabled,
    canSelectRow,
    canSelectMultipleItem,
    manipulationMode,
    title,
    isAnyNetworkOperationRunning,
    isDataManipulationUiActive,
    manipulationModeLabel,
    titleWithManipulationMode,
    setTitle(newTitle: string) {
      title.set(newTitle);
      return this;
    },

    setManipulationMode(mode: ManipulationMode | null) {
      manipulationMode.set(mode);
      return this;
    },
    setIsCheckBoxSelectionEnabled(canSelect: boolean) {
      isCheckBoxSelectionEnabled.set(canSelect);
      return this;
    },

    setCanSelectRow(canSelect: boolean) {
      canSelectRow.set(canSelect);
      return this;
    },

    setCanSelectMultipleItem(canSelect: boolean) {
      canSelectMultipleItem.set(canSelect);
      return this;
    },

    setIsAnyNetworkOperationRunning(status: boolean) {
      isAnyNetworkOperationRunning.set(status);
      return this;
    },

    setIsDataManipulationUiActive(status: boolean) {
      isDataManipulationUiActive.set(status);
      return this;
    },

    resetAll() {
      isCheckBoxSelectionEnabled.set(false);
      canSelectRow.set(false);
      canSelectMultipleItem.set(false);
      manipulationMode.set(null);
      title.set("");
      isAnyNetworkOperationRunning.set(false);
      isDataManipulationUiActive.set(false);
      return this;
    }
  });
}
