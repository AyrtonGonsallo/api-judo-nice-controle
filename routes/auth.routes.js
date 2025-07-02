const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();
const nodemailer = require('nodemailer');
const Utilisateur = db.Utilisateur;
const Role = db.Role;
const Dojo = db.Dojo;
const Cours = db.Cours;
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


// --- POST: Ajouter un utilisateur ---
router.post('/add_user', async (req, res) => {
  try {
    const { nom, prenom, email, password, roleId,dojoId } = req.body;
    if (!nom || !prenom || !email || !password || !roleId || !dojoId) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifie si l'utilisateur existe déjà
    let existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Utilisateur déjà existant' });
    }

    // Hash du mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Création utilisateur
    const user = await Utilisateur.create({
      nom,
      prenom,
      email,
      password: hash,
      roleId,
      dojoId
    });



    let htmlContent;
    // Obtenir la date et l'heure actuelle
    const currentDate = new Date();
    const options = {
      weekday: 'long', // Affiche le jour de la semaine
      day: '2-digit',
      month: 'long',  // Affiche le mois en toute lettre
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,  // Utilise l'heure en format 24h
    };
    
    const formattedDate = currentDate.toLocaleString('fr-FR', options);
    const dateString = formattedDate.replace(",", " à"); 
    // Si des devis sont trouvés
    if (user) {
      // Générer l'email en utilisant un template EJS avec la liste des devis
      const emailTemplatePath = path.join(__dirname, '..','mails-templates', 'email_creation_compte.ejs');
      htmlContent = await ejs.renderFile(emailTemplatePath, { user,password,dateString  });
    } 

    // Configuration de l'email
    const mailOptions = {
      from: '"OJ Nice" <admin@ojnice.nash-project.name>',
      to: email,
      subject: 'Votre compte sur l\'aplication OJ Nice a été créé !',
      html: htmlContent
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (err) {
    console.log({ message: 'Erreur serveur', error: err.message })
    res.status(500).json({ message: 'Erreur serveur', error: err.message });

  }
});


function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length * 2); // Génère plus que nécessaire
  let password = '';

  for (let i = 0; i < bytes.length && password.length < length; i++) {
    const index = bytes[i] % chars.length;
    password += chars.charAt(index);
  }

  return password;
}

router.post('/recuperer_utilisateur', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "L'email est requis" });
    }

    const user = await Utilisateur.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: `L'email ${email} ne figure pas dans la liste des utilisateurs de l'application. Veuillez contacter Olivier Fondriest.` });
    }

    const newPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });


    const currentDate = new Date();
    const options = {
      weekday: 'long', // Affiche le jour de la semaine
      day: '2-digit',
      month: 'long',  // Affiche le mois en toute lettre
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,  // Utilise l'heure en format 24h
    };
    const formattedDate = currentDate.toLocaleString('fr-FR', options);
    const dateString = formattedDate.replace(",", " à"); 


    // Exemple : envoyer un email simple
    const emailTemplatePath = path.join(__dirname, '..','mails-templates', 'email_recuperation_compte.ejs');

    // Rendu EJS
    const htmlContent = await ejs.renderFile(emailTemplatePath, { dateString,user,newPassword });

    const mailOptions = {
      from: '"OJ Nice" <admin@ojnice.nash-project.name>',
      to: email,
      subject: 'Récupération du mot de passe sur votre compte OJ Nice',
      html: htmlContent
    };
    

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: `Votre mot de passe vient de vous être envoyé à l'adresse e-mail ${email}` });

  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});



// --- DELETE: Supprimer un utilisateur ---
router.delete('/delete_user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await Utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.destroy();
    res.json({ message: `Utilisateur ${id} supprimé` });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// --- PUT: Modifier un utilisateur ---
router.put('/edit_user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nom, prenom, email, roleId,dojoId } = req.body;

    const user = await Utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Met à jour les champs reçus (si présents)
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;
    if (roleId) user.roleId = roleId;
    if (dojoId) user.dojoId = dojoId;

    await user.save();

    res.json({ message: `Utilisateur ${id} modifié`, user });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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



// Route GET pour récupérer un utilisateur par id avec son rôle
router.get('/get_user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const utilisateur = await Utilisateur.findOne({
      where: { id: userId },
      include: [
        { model: Role },
        { model: Dojo }
      ],
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(utilisateur);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Route GET pour récupérer un utilisateur par id avec son rôle
router.get('/get_all_teacher_datas/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const utilisateur = await Utilisateur.findOne({
      where: { id: userId,roleId: 2, },
      include: [
        { model: Role },
        { model: Dojo },
        { model: Cours,
          include: [{ model: Dojo }],
        }
      ],
       order: [[{ model: Cours }, 'jour_num', 'ASC'], [{ model: Cours }, 'heure', 'ASC']]
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(utilisateur);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
 
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      
    });
    res.json(roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des roles :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
