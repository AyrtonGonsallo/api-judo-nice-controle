const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const Utilisateur = db.Utilisateur;
const Role = db.Role;

const SECRET = 'votre_clé_secrète'; // stocke-la dans .env plus tard

// Route de login (POST)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Utilisateur.findOne({ where: { email }, include: Role });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, role: user.roleId }, SECRET, { expiresIn: '24h' });

    res.json({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.Role.titre,
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Route GET pour créer rôle et utilisateur de test
router.get('/init', async (req, res) => {
  try {
    // Création ou récupération du rôle
    let role = await Role.findOne({ where: { titre: 'admin' } });
    if (!role) {
      role = await Role.create({ titre: 'admin' });
    }

    // Vérifie si utilisateur déjà créé
    let user = await Utilisateur.findOne({ where: { email: 'jdean@gmail.com' } });
    if (!user) {
      const hash = await bcrypt.hash('test5678', 10);//test12334
      user = await Utilisateur.create({
        nom: 'Dean',
        prenom: 'James',
        email: 'jdean@gmail.com',
        password: hash,
        roleId: role.id
      });
    }

    res.json({
      message: 'Rôle et utilisateur test prêts',
      role,
      user
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur init', error: err.message });
  }
});


// Nouvelle route GET pour récupérer les utilisateurs avec leur rôle
router.get('/utilisateurs', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      include: {
        model: Role,
        attributes: ['id', 'titre']
      },
      attributes: ['id', 'prenom', 'nom', 'email']
    });
    res.json(utilisateurs);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
