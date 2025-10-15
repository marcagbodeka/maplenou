import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { People, PlusCircle, PencilSquare } from "react-bootstrap-icons";
import { api } from "../api";

const parcoursOptions = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"];
const institutsOptions = ["ISSJ", "ISEG", "ESI/DGI", "HEC", "IAEC"];

function Allocations({ admin, onBack, onLogout }) {
  const [vendeurs, setVendeurs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newVendeur, setNewVendeur] = useState({ 
    nom: "", 
    prenom: "",
    email: "",
    whatsapp: "",
    institut: "", 
    parcours: "",
    password: ""
  });
  const [editingVendeur, setEditingVendeur] = useState(null);
  const [selectedVendeur, setSelectedVendeur] = useState("");
  const [quantite, setQuantite] = useState("");
  const [message, setMessage] = useState("");

  // Charger la liste des vendeurs
  useEffect(() => {
    const loadVendeurs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users/vendors', {
          headers: { Authorization: `Bearer ${admin.token}` }
        });
        if (response.data.success) {
          setVendeurs(response.data.vendors);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vendeurs:', error);
        setMessage('Erreur lors du chargement des vendeurs');
      } finally {
        setLoading(false);
      }
    };
    loadVendeurs();
  }, [admin.token]);

  const handleCreateVendeur = async () => {
    if (!newVendeur.nom || !newVendeur.prenom || !newVendeur.email || !newVendeur.password || !newVendeur.institut || !newVendeur.parcours) {
      setMessage("Veuillez remplir tous les champs obligatoires du vendeur (nom, prénom, email, mot de passe, institut, parcours).");
      return;
    }

    try {
      setLoading(true);
      console.log('Creating vendor with data:', newVendeur);
      const response = await api.post('/admin/users/vendor', {
        ...newVendeur,
        role: 'vendeur'
      }, {
        headers: { Authorization: `Bearer ${admin.token}` }
      });

      if (response.data.success) {
        setMessage(`✅ Nouveau vendeur "${newVendeur.nom} ${newVendeur.prenom}" ajouté !`);
        setNewVendeur({ nom: "", prenom: "", email: "", whatsapp: "", institut: "", parcours: "", password: "" });
        // Recharger la liste
        const vendorsResponse = await api.get('/admin/users/vendors', {
          headers: { Authorization: `Bearer ${admin.token}` }
        });
        if (vendorsResponse.data.success) {
          setVendeurs(vendorsResponse.data.vendors);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création du vendeur:', error);
      console.error('Error response:', error.response?.data);
      setMessage(error.response?.data?.message || 'Erreur lors de la création du vendeur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVendeur = (vendeur) => {
    setEditingVendeur(vendeur);
    setNewVendeur({
      nom: vendeur.nom,
      prenom: vendeur.prenom,
      email: vendeur.email,
      whatsapp: vendeur.whatsapp || "",
      institut: vendeur.institut,
      parcours: vendeur.parcours,
      password: ""
    });
  };

  const handleUpdateVendeur = async () => {
    if (!editingVendeur) return;

    try {
      setLoading(true);
      const updateData = {
        nom: newVendeur.nom,
        prenom: newVendeur.prenom,
        email: newVendeur.email,
        whatsapp: newVendeur.whatsapp,
        institut: newVendeur.institut,
        parcours: newVendeur.parcours
      };

      if (newVendeur.password) {
        updateData.password = newVendeur.password;
      }

      const response = await api.put(`/admin/users/vendor/${editingVendeur.id}`, updateData, {
        headers: { Authorization: `Bearer ${admin.token}` }
      });

      if (response.data.success) {
        setMessage(`✅ Vendeur "${newVendeur.nom} ${newVendeur.prenom}" modifié !`);
        setEditingVendeur(null);
        setNewVendeur({ nom: "", prenom: "", email: "", whatsapp: "", institut: "", parcours: "", password: "" });
        const vendorsResponse = await api.get('/admin/users/vendors', {
          headers: { Authorization: `Bearer ${admin.token}` }
        });
        if (vendorsResponse.data.success) {
          setVendeurs(vendorsResponse.data.vendors);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la modification du vendeur:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de la modification du vendeur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingVendeur(null);
    setNewVendeur({ nom: "", prenom: "", email: "", whatsapp: "", institut: "", parcours: "", password: "" });
  };

  const handleValider = async () => {
    if (!selectedVendeur || !quantite) {
      setMessage("Veuillez choisir un vendeur et entrer une quantité.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/allocate', {
        vendeur_id: selectedVendeur,
        quantite: parseInt(quantite)
      }, {
        headers: { Authorization: `Bearer ${admin.token}` }
      });

      if (response.data.success) {
        const vendeur = vendeurs.find(v => v.id === selectedVendeur);
        setMessage(`✅ ${quantite} croissants attribués à ${vendeur.nom} ${vendeur.prenom} (${vendeur.institut} - ${vendeur.parcours}).`);
        setQuantite("");
        setSelectedVendeur("");
      }
    } catch (error) {
      console.error('Erreur lors de l\'allocation:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de l\'allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        minHeight: "100dvh",
        paddingTop: "45rem", // descente du formulaire
        paddingBottom: "3rem",
        overflowY: "auto"
      }}
    >
      <div className="container px-4">
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4">

          <h5 className="fw-bold mb-4" style={{ color: "#1e293b" }}>
            ⚙️ Gestion des Allocations
          </h5>

          {/* Création/Modification d'un vendeur */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <PlusCircle size={18} className="me-2 text-success" />
              {editingVendeur ? 'Modifier le vendeur' : 'Créer un nouveau vendeur'}
            </h6>
            <div className="row g-2 mb-2">
              <div className="col-md-3">
                <input
                  type="text"
                  placeholder="Nom"
                  value={newVendeur.nom}
                  onChange={e => setNewVendeur({ ...newVendeur, nom: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={newVendeur.prenom}
                  onChange={e => setNewVendeur({ ...newVendeur, prenom: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={newVendeur.email}
                  onChange={e => setNewVendeur({ ...newVendeur, email: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <input
                  type="tel"
                  placeholder="WhatsApp"
                  value={newVendeur.whatsapp}
                  onChange={e => setNewVendeur({ ...newVendeur, whatsapp: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={newVendeur.institut}
                  onChange={e => setNewVendeur({ ...newVendeur, institut: e.target.value })}
                >
                  <option value="">-- Choisir un institut --</option>
                  {institutsOptions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={newVendeur.parcours}
                  onChange={e => setNewVendeur({ ...newVendeur, parcours: e.target.value })}
                >
                  <option value="">-- Choisir un parcours --</option>
                  {parcoursOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <input
                  type="password"
                  placeholder={editingVendeur ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                  value={newVendeur.password}
                  onChange={e => setNewVendeur({ ...newVendeur, password: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
              {editingVendeur ? (
                <>
                  <button className="btn btn-primary" onClick={handleUpdateVendeur} disabled={loading}>
                    {loading ? 'Modification...' : 'Modifier'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    Annuler
                  </button>
                </>
              ) : (
                <button className="btn btn-success" onClick={handleCreateVendeur} disabled={loading}>
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              )}
            </div>
          </div>

          {/* Attribution des croissants */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3">
              <People size={18} className="me-2 text-primary" />
              Attribuer des croissants
            </h6>
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={selectedVendeur}
                  onChange={e => setSelectedVendeur(e.target.value)}
                >
                  <option value="">-- Choisir un vendeur --</option>
                  {vendeurs.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nom} - {v.parcours} - {v.institut}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Nombre de croissants"
                  value={quantite}
                  onChange={e => setQuantite(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-grid">
                <button className="btn btn-primary" onClick={handleValider}>
                  Valider
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="alert alert-info rounded-3 text-center py-2">{message}</div>
          )}

          {/* Boutons Retour et Déconnexion */}
          <div className="d-grid gap-2 mt-4">
            <button className="btn btn-outline-primary" onClick={onBack}>← Retour</button>
            <button className="btn btn-outline-light text-white" onClick={onLogout}>Se déconnecter</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Allocations;
