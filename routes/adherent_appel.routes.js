const express = require('express');
const db = require('../db');
const router = express.Router();
const Dojo = db.Dojo;
const Utilisateur = db.Utilisateur;
const Cours = db.Cours;
const Adherent = db.Adherent;
const Appel = db.Appel;
const { Op } = require('sequelize');


const { Sequelize,  } = require('sequelize');

router.post('/add_adherent', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_inscription,
      dojoId,
      categorie_age,
      coursIds // tableau d'IDs de cours : [1, 2, 3]
    } = req.body;

    // Créer l'adhérent
    const newAdherent = await Adherent.create({
      nom,
      prenom,
      email,
      telephone,
      date_inscription,
      dojoId,
      categorie_age
    });

    // Associer aux cours si des cours sont fournis
    if (Array.isArray(coursIds) && coursIds.length > 0) {
      await newAdherent.setCours(coursIds); // setCours est généré automatiquement par Sequelize
    }

    // Renvoyer l'adhérent avec ses cours associés (optionnel)
    const adherentWithCours = await Adherent.findByPk(newAdherent.id, {
      include: ['Cours'] // ou le modèle si nommé explicitement
    });

    res.status(201).json(adherentWithCours);
  } catch (error) {
    console.error('Erreur POST /add_adherent:', error);
    res.status(400).json({
      error: 'Erreur lors de la création de l’adhérent',
      details: error.message
    });
  }
});


router.get('/get_adherents', async (req, res) => {
  try {
    const adherents = await Adherent.findAll({
      include: [
        {
          model: Cours,
          through: { attributes: [] }, // pour ne pas afficher CoursAdherent
        },
        {
          model: Dojo,
          attributes: ['id', 'nom']     // facultatif si tu veux afficher le dojo
        }
      ]
    });

    res.status(200).json(adherents);
  } catch (error) {
    console.error('Erreur lors de la récupération des adhérents :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/get_adherent/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const adherent = await Adherent.findByPk(id, {
      include: [
        {
          model: Cours,
          through: { attributes: [] }
        },
        {
          model: Dojo,
          attributes: ['id', 'nom']
        }
      ]
    });

    if (!adherent) {
      return res.status(404).json({ message: 'Adhérent non trouvé.' });
    }

    res.status(200).json(adherent);
  } catch (error) {
    console.error('Erreur lors de la récupération de l’adhérent :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.put('/edit_adherent/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nom,
    prenom,
    email,
    telephone,
    date_inscription,
    dojoId,
    categorie_age,
    coursIds // tableau de IDs de cours à associer
  } = req.body;

  try {
    const adherent = await Adherent.findByPk(id);

    if (!adherent) {
      return res.status(404).json({ message: 'Adhérent non trouvé.' });
    }

    // Mettre à jour les données principales
    await adherent.update({
      nom,
      prenom,
      email,
      telephone,
      date_inscription,
      dojoId,
      categorie_age
    });

    // Mettre à jour l'association avec les cours (via la table de liaison)
    if (Array.isArray(coursIds)) {
      await adherent.setCours(coursIds);
    }

    // Recharger avec les relations
    const updated = await Adherent.findByPk(id, {
      include: [
        {
          model: Cours,
          through: { attributes: [] }
        },
        {
          model: Dojo,
          attributes: ['id', 'nom']
        }
      ]
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Erreur lors de la modification de l’adhérent :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/adherents_by_cours/:coursId', async (req, res) => {
  const { coursId } = req.params;

  try {
    const cours = await Cours.findByPk(coursId, {
      include: [
        {
          model: Adherent,
          through: { attributes: [] },
          include: [
            {
              model: Dojo,
              attributes: ['id', 'nom']
            }
          ]
        }
      ],
    });

    if (!cours) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }

    res.status(200).json(cours.Adherents); // ou cours.getAdherents() si besoin
  } catch (error) {
    console.error('Erreur lors de la récupération des adhérents par cours :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/adherents_by_cours_with_appels/:coursId', async (req, res) => {
  const { coursId } = req.params;
  const today = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD

  try {
    const cours = await Cours.findByPk(coursId, {
      include: [
        {
          model: Adherent,
          through: { attributes: [] },
          include: [
            {
              model: Dojo,
              attributes: ['id', 'nom'],
            }
          ]
        }
      ],
    });

    if (!cours) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }

    const adherents = cours.Adherents;

    // Récupération des appels existants pour la date d'aujourd'hui
    const appelsExistants = await Appel.findAll({
      where: {
        coursId: coursId,
        date: today,
        adherentId: {
          [Op.in]: adherents.map(a => a.id),
        },
      }
    });

    // Création d'une map pour les appels existants
    const appelMap = {};
    appelsExistants.forEach(appel => {
      appelMap[appel.adherentId] = appel;
    });

    const appelsManquants = [];

    for (const adherent of adherents) {
      if (!appelMap[adherent.id]) {
        // Créer un appel absent si inexistant
        const nouvelAppel = await Appel.create({
          date: today,
          status: false,
          coursId: coursId,

          adherentId: adherent.id
        });
        appelMap[adherent.id] = nouvelAppel;
      }
    }

    // Reconstituer la réponse
    const result = adherents.map(adherent => ({
      adherent,
      appel: appelMap[adherent.id],
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération/création des appels :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



router.post('/add_appel', async (req, res) => {
  const { status, date, adherentId, coursId } = req.body;

  if (typeof status === 'undefined' || !date || !adherentId || !coursId) {
    return res.status(400).json({ message: 'Données incomplètes.' });
  }

  try {
    // Vérifier s'il existe déjà un appel pour ce jour / cours / adhérent
    const existing = await Appel.findOne({
      where: { adherentId, coursId, date }
    });

    if (existing) {
      return res.status(409).json({ message: 'Appel déjà enregistré pour cet élève à cette date.' });
    }

    // Créer le nouvel appel
    const appel = await Appel.create({
      status, date, adherentId, coursId
    });

    res.status(201).json({
      message: 'Appel enregistré avec succès.',
      appel
    });

  } catch (error) {
    console.error('Erreur ajout appel :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

router.post('/upsert_appel', async (req, res) => {
  const { status, adherentId, coursId } = req.body;

  if (typeof status === 'undefined' || !adherentId || !coursId) {
    console.log(status, adherentId, coursId)
    return res.status(400).json({ message: 'Données incomplètes (status, adherentId, coursId requis).' });
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Rechercher un appel existant pour ce jour
    const existingAppel = await Appel.findOne({
      where: { adherentId, coursId, date: today },
    });

    let appel;

    if (existingAppel) {
      // Modifier le status
      existingAppel.status = status;
      await existingAppel.save();
      appel = existingAppel;
    } else {
      // Créer un nouvel appel
      appel = await Appel.create({
        status,
        adherentId,
        coursId,
        date: today,
      });
    }

    res.status(200).json({
      message: existingAppel ? 'Appel mis à jour.' : 'Appel créé.',
      appel
    });

  } catch (error) {
    console.error('Erreur upsert appel :', error);
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});


router.get('/get_appels', async (req, res) => {
  try {
    const appels = await Appel.findAll({
      include: [
        {
          model: Adherent,
        },
        {
          model: Cours,
        }
      ]
    });
    res.status(200).json(appels);
  } catch (error) {
    console.error('Erreur lors de la récupération des appels :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/get_appels/:id', async (req, res) => {
  try {
    const appel = await Appel.findByPk(req.params.id, {
      include: [
        {
          model: Adherent,
        },
        {
          model: Cours,
        }
      ]
    });
    res.status(200).json(appel);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'appel :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/get_appels_by_cours/:coursId', async (req, res) => {
  const { coursId } = req.params;

  try {
    const appels = await Appel.findAll({
      where: { coursId },  // ✅ filtre par coursId
      include: [
        {
          model: Adherent,
        },
        {
          model: Cours,
        }
      ],
      order: [['date', 'DESC']]
    });

    res.status(200).json(appels);
  } catch (error) {
    console.error('Erreur lors de la récupération des appels :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/get_appels_by_cours_and_date/:coursId/:date', async (req, res) => {
  const { coursId, date } = req.params;

  try {
    const appels = await Appel.findAll({
      where: {
        coursId,
        date  // Sequelize gère correctement les DATEONLY avec des strings 'YYYY-MM-DD'
      },
      include: [
        {
          model: Adherent,
        },
        {
          model: Cours,
        }
      ],
      order: [['adherentId', 'ASC']]
    });

    res.status(200).json(appels);
  } catch (error) {
    console.error('Erreur lors de la récupération des appels :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



router.get('/get_distincts_appel_dates_by_cours/:coursId', async (req, res) => {
  const { coursId } = req.params;

  try {
    const dates = await Appel.findAll({
      where: { coursId },
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('date')), 'date']
      ],
      order: [['date', 'DESC']],
      raw: true
    });

    res.status(200).json(dates.map(d => d.date));
  } catch (error) {
    console.error('Erreur lors de la récupération des dates :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.get('/get_appels_by_adherent/:adherentId', async (req, res) => {
  const { adherentId } = req.params;

  try {
    const appels = await Appel.findAll({
      where: { adherentId },  // ✅ filtre par coursId
      include: [
        {
          model: Adherent,
        },
        {
          model: Cours,
        }
      ],
      order: [['date', 'DESC']]
    });

    res.status(200).json(appels);
  } catch (error) {
    console.error('Erreur lors de la récupération des appels :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.delete('/delete_appel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const appel = await Appel.findByPk(id);
    if (!appel) {
      return res.status(404).json({ message: 'Appel non trouvé.' });
    }

    await appel.destroy();
    res.status(200).json({ message: 'Appel supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l’appel :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/edit_appel/:id', async (req, res) => {
  const { id } = req.params;
  const { status, date, adherentId, coursId } = req.body;

  try {
    const appel = await Appel.findByPk(id);

    if (!appel) {
      return res.status(404).json({ message: 'Appel non trouvé.' });
    }

    // Mise à jour des champs
    await appel.update({ status, date, adherentId, coursId });

    res.status(200).json({ message: 'Appel mis à jour.', appel });
  } catch (error) {
    console.error('Erreur lors de la modification de l’appel :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});


router.put('/switch_status_appel/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const appel = await Appel.findByPk(id);

    if (!appel) {
      return res.status(404).json({ message: 'Appel non trouvé.' });
    }

    // Inverser le statut
    const nouveauStatus = !appel.status;

    await appel.update({ status: nouveauStatus });

    res.status(200).json({ message: 'Statut inversé avec succès.', status: nouveauStatus });
  } catch (error) {
    console.error('Erreur lors de l’inversion du statut :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});








module.exports = router;