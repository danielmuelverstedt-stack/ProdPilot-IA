/** Champs identifiant l'OF sur l'affiche : retrouvés automatiquement, non modifiables — seul le n° de plan reste saisi à la main, absent de toute source de données. */
export interface PalletLabelFields {
  ofNumber: string;
  client: string;
  quantity: string;
  articleCode: string;
  description: string;
  planNumber: string;
}

/** Demande de l'utilisateur : les champs de l'OF, plus le nombre de palettes à imprimer (une affiche par palette, numérotée automatiquement). */
export interface PalletLabelPrintRequest extends PalletLabelFields {
  palletCount: string;
}

/** Champs complets d'une affiche précise (une palette du lot demandé). */
export interface PalletLabelFormData extends PalletLabelFields {
  palletNumber: string;
  palletCount: string;
}
