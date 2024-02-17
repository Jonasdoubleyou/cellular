import { Block, BlockID } from "./block";

export interface CellularModel {
    title: string;

    // An acyclic list of Blocks - A Block can only use
    // previous blocks as input
    blocks: Block[];
}


