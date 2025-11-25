import { signal, computed, Signal, WritableSignal } from "@angular/core";
import { ManipulationMode } from "../types";

export type SlimComponentState = {
  isCheckBoxSelectionEnabled: WritableSignal<boolean>;
  canSelectRow: WritableSignal<boolean>;
  canSelectMultipleItem: WritableSignal<boolean>;
  manipulationMode: WritableSignal<ManipulationMode | null>;
  title: WritableSignal<string>;
  isAnyNetworkOperationRunning: WritableSignal<boolean>;
  isDataManipulationUiActive: WritableSignal<boolean>;
  manipulationModeLabel: Signal<string>;
  titleWithManipulationMode: Signal<string>;
  setTitle(newTitle: string): SlimComponentState;
  setManipulationMode(mode: ManipulationMode | null): SlimComponentState;
  setIsCheckBoxSelectionEnabled(canSelect: boolean): SlimComponentState;
  setCanSelectRow(canSelect: boolean): SlimComponentState;
  setCanSelectMultipleItem(canSelect: boolean): SlimComponentState;
  setIsAnyNetworkOperationRunning(status: boolean): SlimComponentState;
  setIsDataManipulationUiActive(status: boolean): SlimComponentState;
  resetAll(): SlimComponentState;
};

export function slimComponentState(): SlimComponentState {
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

    setManipulationMode(mode: ManipulationMode | null): SlimComponentState {
      manipulationMode.set(mode);
      return this;
    },
    setIsCheckBoxSelectionEnabled(canSelect: boolean): SlimComponentState {
      isCheckBoxSelectionEnabled.set(canSelect);
      return this;
    },

    setCanSelectRow(canSelect: boolean): SlimComponentState {
      canSelectRow.set(canSelect);
      return this;
    },

    setCanSelectMultipleItem(canSelect: boolean): SlimComponentState {
      canSelectMultipleItem.set(canSelect);
      return this;
    },

    setIsAnyNetworkOperationRunning(status: boolean): SlimComponentState {
      isAnyNetworkOperationRunning.set(status);
      return this;
    },

    setIsDataManipulationUiActive(status: boolean): SlimComponentState {
      isDataManipulationUiActive.set(status);
      return this;
    },

    resetAll(): SlimComponentState {
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
