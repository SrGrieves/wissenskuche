// Stockpile Aggregate Root

export type Stockpile = {
  player: string;
  stock: [[StockedMaterial,Number]];
}

export type StockedMaterial = {
  type: string;
  attributes: [[string,any]] 
}


//Materials Aggregate Root
export type MaterialDefinition = {
  name: string;
  qualifiesAs: [string]
  applicableAttributes: [string];
  productionRequirements?: {
    materials: [[string,Number]],
    knowledge: [string]
  };
  productionByproducts: [[string,Number]];
}


//Knowledge Aggregate Root
export type KnowledgeDefinition = {
  name: string
  acceptableProofsOfKnowledge: [ShortEssayProofOfKnowledge | MultiChoiceProofOfKnowledge]
}

export type ShortEssayProofOfKnowledge = {
  validKeywordGroups: [[string]];
  requiredNumberOfMatches: Number;
}

export type MultiChoiceProofOfKnowledge = {

}