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
    return `${manipulationModeLabel()}  ${title()}`;
  });

  const dataStates = Object.seal({
    isCheckBoxSelectionEnabled,
    canSelectRow,
    canSelectMultipleItem,
    manipulationMode,
    title,
    isAnyNetworkOperationRunning,
    isDataManipulationUiActive,
    manipulationModeLabel,
    titleWithManipulationMode
  });

  return Object.seal({
    ...dataStates,
    setTitle(newTitle: string) {
      dataStates.title.set(newTitle);
      return this;
    },

    setManipulationMode(mode: ManipulationMode | null) {
      dataStates.manipulationMode.set(mode);
      return this;
    },
    setIsCheckBoxSelectionEnabled(canSelect: boolean) {
      dataStates.isCheckBoxSelectionEnabled.set(canSelect);
      return this;
    },

    setCanSelectRow(canSelect: boolean) {
      dataStates.canSelectRow.set(canSelect);
      return this;
    },

    setCanSelectMultipleItem(canSelect: boolean) {
      dataStates.canSelectMultipleItem.set(canSelect);
      return this;
    },

    setIsAnyNetworkOperationRunning(status: boolean) {
      dataStates.isAnyNetworkOperationRunning.set(status);
      return this;
    },

    setIsDataManipulationUiActive(status: boolean) {
      dataStates.isDataManipulationUiActive.set(status);
      return this;
    },

    resetAll() {
      dataStates.isCheckBoxSelectionEnabled.set(false);
      dataStates.canSelectRow.set(false);
      dataStates.canSelectMultipleItem.set(false);
      dataStates.manipulationMode.set(null);
      dataStates.title.set("");
      dataStates.isAnyNetworkOperationRunning.set(false);
      dataStates.isDataManipulationUiActive.set(false);
      return this;
    }
  });
}
