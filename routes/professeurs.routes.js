const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
const nodemailer = require('nodemailer');
const Utilisateur = db.Utilisateur;
const Role = db.Role;
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const SECRET = 'votre_clé_secrète'; // stocke-la dans .env plus tard


const transporter = nodemailer.createTransport({
  host: 'ojnice.nash-project.name', // Serveur SMTP de admin@ojnice.nash-project.name
  port: 465, // Port SMTP
  secure: true, // Utiliser SSL
  auth: {
    user: 'admin@ojnice.nash-project.name', // Votre adresse e-mail
    pass: '[wRe])c9Z,~-' // Votre mot de passe
  }
});



router.get('/get_professeurs', async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      where: { roleId: 2 },  // 🎯 filtre ici
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
