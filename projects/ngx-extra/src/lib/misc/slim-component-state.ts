import { signal, computed } from "@angular/core";
import { ManipulationMode } from "../types";

export class SlimComponentState {
  readonly isCheckBoxSelectionEnabled = signal<boolean>(false);
  readonly canSelectRow = signal<boolean>(false);
  readonly canSelectMultipleItem = signal<boolean>(false);

  readonly manipulationMode = signal<ManipulationMode | null>(null);
  readonly title = signal<string>("");

  readonly isAnyNetworkOperationRunning = signal<boolean>(false);
  readonly isDataManipulationUiActive = signal<boolean>(false);

  readonly titleWithManipulationMode = computed(() => {
    return `${this.manipulationModeLabel()}  ${this.title()}`;
  });

  readonly manipulationModeLabel = computed(() => {
    switch (this.manipulationMode()) {
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

  setTitle = (title: string) => {
    this.title.set(title);
    return this;
  };

  setManipulationMode = (mode: ManipulationMode | null) => {
    this.manipulationMode.set(mode);
    return this;
  };

  setIsCheckBoxSelectionEnabled = (canSelect: boolean) => {
    this.isCheckBoxSelectionEnabled.set(canSelect);
    return this;
  };

  setCanSelectRow = (canSelect: boolean) => {
    this.canSelectRow.set(canSelect);
    return this;
  };

  setCanSelectMultipleItem = (canSelect: boolean) => {
    this.canSelectMultipleItem.set(canSelect);
    return this;
  };

  setIsAnyNetworkOperationRunning = (status: boolean) => {
    this.isAnyNetworkOperationRunning.set(status);
    return this;
  };

  setIsDataManipulationUiActive = (status: boolean) => {
    this.isDataManipulationUiActive.set(status);
    return this;
  };

  reset = () => {
    this.isCheckBoxSelectionEnabled.set(false);
    this.canSelectRow.set(false);
    this.canSelectMultipleItem.set(false);
    this.manipulationMode.set(null);
    this.title.set("");
    this.isAnyNetworkOperationRunning.set(false);
    this.isDataManipulationUiActive.set(false);
    return this;
  };
}
