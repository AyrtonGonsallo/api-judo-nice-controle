const express = require('express');
const db = require('../db');
const router = express.Router();
const Dojo = db.Dojo;
const Utilisateur = db.Utilisateur;
const Cours = db.Cours;



//  CREATE - Ajouter un dojo
router.post('/add_dojo', async (req, res) => {
  try {
    const newDojo = await Dojo.create(req.body);
    res.status(201).json(newDojo);
  } catch (error) {
    console.error('Erreur lors de la création du dojo :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/get_dojos', async (req, res) => {
  try {
    const dojos = await Dojo.findAll({
      include: [
        {
          model: Cours,
          attributes: ['id', 'categorie_age', 'jour', 'heure']
        },
        {
          model: Utilisateur,
          attributes: ['id', 'prenom', 'nom', 'email', 'roleId']
        }
      ],
      order: [['nom', 'ASC']]  // Tri ici
    });
    res.json(dojos);
  } catch (error) {
    console.error('Erreur lors de la récupération des dojos :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



//  READ - Récupérer tous les dojos
router.get('/get_dojos_by_id', async (req, res) => {
  try {
    const dojos = await Dojo.findAll({
  include: [
    {
      model: Cours,
      attributes: ['id', 'categorie_age', 'jour', 'heure', ]
    },
    {
      model: Utilisateur,
      attributes: ['id', 'prenom', 'nom', 'email', 'roleId']
    }
  ]
});
    res.json(dojos);
  } catch (error) {
    console.error('Erreur lors de la récupération des dojos :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



//  READ ONE - Récupérer un dojo spécifique
router.get('/get_dojo/:id', async (req, res) => {
  try {
    const dojo = await Dojo.findByPk(req.params.id, {
        include: [
            {
            model: Cours,
            attributes: ['id', 'categorie_age', 'jour', 'heure',]
            },
            {
            model: Utilisateur,
            attributes: ['id', 'prenom', 'nom', 'email', 'roleId']
            }
        ]
        });
    if (!dojo) return res.status(404).json({ error: 'Dojo non trouvé' });
    res.json(dojo);
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  UPDATE - Modifier un dojo
router.put('/update_dojo/:id', async (req, res) => {
  try {
    const [updated] = await Dojo.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) return res.status(404).json({ error: 'Dojo non trouvé' });
    const updatedDojo = await Dojo.findByPk(req.params.id);
    res.json(updatedDojo);
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  DELETE - Supprimer un dojo
router.delete('/delete_dojo/:id', async (req, res) => {
  try {
    const deleted = await Dojo.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Dojo non trouvé' });
    res.json({ message: 'Dojo supprimé avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


//  get_all_cours – récupérer tous les cours
router.get('/get_all_cours', async (req, res) => {
  try {
    const cours = await Cours.findAll({
      include: [
        {
          model: Dojo,
          attributes: ['id', 'nom']
        },
        {
          model: Utilisateur,
          attributes: ['id', 'prenom', 'nom', 'email'],
          through: { attributes: [] }  // cache les infos de la table pivot CoursProf
        }
      ]
    });
    res.json(cours);
  } catch (error) {
    console.error('Erreur get_all_cours :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  get_cours – récupérer un cours par ID
router.get('/get_cours/:id', async (req, res) => {
  try {
    const cours = await Cours.findByPk(req.params.id, {
      include: [
        {
          model: Dojo,
          attributes: ['id', 'nom']
        },
        {
          model: Utilisateur,
          attributes: ['id', 'prenom', 'nom', 'email'],
          through: { attributes: [] } // cache la table pivot CoursProf
        }
      ]
    });
    if (!cours) return res.status(404).json({ error: 'Cours non trouvé' });
    res.json(cours);
  } catch (error) {
    console.error('Erreur get_cours :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//  add_cours – ajouter un nouveau cours
// POST /api/dojo_cours/add_cours
router.post('/add_cours', async (req, res) => {
  const { jour, heure, dojoId, profsIds, categorie_age } = req.body;

  try {
    // 1. Créer le cours
    const cours = await Cours.create({
      jour,
      heure,
      dojoId,
      categorie_age: Array.isArray(categorie_age) ? categorie_age.join(', ') : categorie_age // stockage en texte simple
    });

    // 2. Associer les professeurs (table de liaison many-to-many)
    if (Array.isArray(profsIds) && profsIds.length > 0) {
      await cours.setUtilisateurs(profsIds); // relation many-to-many
    }

    res.status(201).json({
      message: 'Cours créé avec succès',
      cours
    });

  } catch (error) {
    console.error('Erreur add_cours :', error);
    res.status(500).json({ message: "Erreur lors de la création du cours" });
  }
});


router.put('/update_cours/:id', async (req, res) => {
  const { jour, heure, dojoId, categorie_age, profsIds } = req.body;

  try {
    // 1. Trouver le cours
    const cours = await Cours.findByPk(req.params.id);
    if (!cours) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // 2. Mettre à jour les champs simples
    await cours.update({
      jour,
      heure,
      dojoId,
      categorie_age: Array.isArray(categorie_age) ? categorie_age.join(', ') : categorie_age
    });

    // 3. Mettre à jour les professeurs (relation many-to-many)
    if (Array.isArray(profsIds)) {
      await cours.setUtilisateurs(profsIds); // met à jour la table CoursProf
    }

    // 4. Retourner le cours mis à jour (avec relations si besoin)
    const updatedCours = await Cours.findByPk(req.params.id, {
      include: [
        {
          model: Utilisateur,
          attributes: ['id', 'prenom', 'nom'],
          through: { attributes: [] }
        },
        {
          model: Dojo,
          attributes: ['id', 'nom']
        }
      ]
    });

    res.json({
      message: 'Cours mis à jour avec succès',
      cours: updatedCours
    });

  } catch (error) {
    console.error('Erreur update_cours :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


//  delete_cours – supprimer un cours
router.delete('/delete_cours/:id', async (req, res) => {
  try {
    const deleted = await Cours.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Cours non trouvé' });
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete_cours :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;