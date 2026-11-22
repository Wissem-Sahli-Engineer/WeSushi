/* ------------------------------------------------------------------
   WesSushi : tes infos sont ici, et seulement ici.
   Modifie ce fichier, le site se met à jour tout seul.
------------------------------------------------------------------- */
window.WESSUSHI = {
  // Numéro au format international, sans + ni espaces. Exemple : "21612345678"
  whatsapp: "21652515313",

  // Ton compte Instagram, sans le @. Exemple : "wessushi"
  instagram: "",

  // Les box en vente : nombre de pièces et prix en DT
  boxes: [
    { pieces: 8, price: 12 },
    { pieces: 10, price: 15 },
  ],

  // Les zones de livraison et leur prix en DT. Ajoute, retire ou change un prix ici.
  deliveryZones: [
    { name: "Lac 1", price: 3 },
    { name: "L'Aouina", price: 4 },
    { name: "El Wahat", price: 6 },
    { name: "Cité El Khadra", price: 4 },
    { name: "Centre-ville", price: 7 },
    { name: "Charguia 1 et 2", price: 5 },
  ],

  // Les ingrédients que le client peut choisir (tous cochés au départ)
  ingredients: ["Crevette", "Avocat", "Fromage"],

  // Nombre maximum de box identiques par commande
  maxPerBox: 10,

  // Ce que les clients voient sur le site
  zone: "Lac 1, Tunis",

  // Ce qui s'affiche sous la zone
  address: "",

  // Le lien du bouton "Ouvrir dans Plans"
  mapUrl: "https://maps.apple/p/jWtMPZrDEqg5uh",

  // La position utilisée pour afficher la carte
  mapQuery: "36.838164,10.237533",

  // Les vrais avis de tes clients. Ajoute-les ici quand tu les reçois :
  // { name: "Prénom", stars: 5, text: "Ce que la personne a écrit." },
  reviews: [
  ],
};
