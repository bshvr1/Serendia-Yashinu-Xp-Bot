const { Client, MessageEmbed, Collection, WebhookClient } = require('discord.js');
const client = global.client = new Client;
const db = require("quick.db");
const ayarlar = require("./ayarlar.json");
const request = require('node-superfetch');

var prefix = ayarlar.prefix;

client.on("ready", () => {
  console.log(client.user.tag + " aktif oldu");
  client.user.setActivity(client.guilds.cache.get('8').name, { type: "WATCHING" });
});

client.seviyeYokla = function (sunucu, kisi) {
  let uye = client.guilds.cache.get(sunucu).members.cache.get(kisi);
  let levelRolleri = db.get(`seviye.${sunucu}.rolOdul`);
  let seviyeUye = db.get(`seviye.${sunucu}.${kisi}.lvl`);
  let odulTur = db.get(`seviye.${sunucu}.rolOdulTur`);
  if (!uye || !seviyeUye || !levelRolleri || (db.get(`seviye.${sunucu}.gecersizler`) && db.get(`seviye.${sunucu}.gecersizler`).some(id => uye.id === id.slice(1) || uye.roles.cache.has(id.slice(1))))) return;
  let seviyeler = Object.keys(levelRolleri);
  if (odulTur) {
    let enUstOdulu = seviyeler.filter(seviye => seviyeUye >= Number(seviye.slice(3))).sort((s1, s2) => Number(s2.slice(3))-Number(s1.slice(3)))[0];
    seviyeler.forEach((seviye, index) => {
      if (seviye == enUstOdulu && db.get(`seviye.${sunucu}.rolOdul.${seviye}`).some(x => !uye.roles.cache.has(x.slice(1)))) {
        setTimeout(async () => { await uye.roles.add(db.get(`seviye.${sunucu}.rolOdul.${seviye}`).map(x => x.slice(1))); }, index*1000);
      };
      if (seviye != enUstOdulu && db.get(`seviye.${sunucu}.rolOdul.${seviye}`).some(x => uye.roles.cache.has(x.slice(1)))) {
        setTimeout(async () => { await uye.roles.remove(db.get(`seviye.${sunucu}.rolOdul.${seviye}`).map(x => x.slice(1))); }, index*1000);
      };
    });
  } else {
    seviyeler.forEach((seviye, index) => {
      if (seviyeUye > Number(seviye.slice(3)) && db.get(`seviye.${sunucu}.rolOdul.${seviye}`).some(id => !uye.roles.cache.has(id.slice(1)))) {
        setTimeout(async () => { await uye.roles.add(db.get(`seviye.${sunucu}.rolOdul.${seviye}`).map(id => id.slice(1))); }, index*1000);
      };
      if (seviyeUye < Number(seviye.slice(3)) && db.get(`seviye.${sunucu}.rolOdul.${seviye}`).some(id => uye.roles.cache.has(id.slice(1)))) {
        setTimeout(async () => { await uye.roles.remove(db.get(`seviye.${sunucu}.rolOdul.${seviye}`).map(id => id.slice(1))); }, index*1000);
      };
    });
  };
};

const ark = ["renk", "color"];
const arm = ["resim", "image"];
const reset = ['sıfırla', 'reset'];
const saydam = ['saydamlaştır', 'saydam'];
const award = ['ödül', 'ödüller', 'award', 'reward', 'prize'];
const logargs = ['log', 'kayıt'];
const gecersizargs = ['geçersiz', 'gecersiz', 'cezalı', 'yasaklı'];

client.on("message", async msg => {
  if (
    !msg ||
    msg.author.bot ||
    msg.channel.type === "dm" ||
    !msg.guild ||
    !msg.member
  )
    return;
  let gecersiz = db.get(`seviye.${msg.guild.id}.gecersizler`);
  if (gecersiz && gecersiz.some(id => msg.author.id === id.slice(1) || msg.member.roles.cache.has(id.slice(1)))) return;
  let args = msg.content.split(" ").slice(1);
  if (!gecersizargs.includes(args[0]) && gecersiz && gecersiz.some(id => msg.channel.id === id.slice(1))) return;
  let command = msg.content.split(" ")[0].slice(prefix.length);
  if (command === "eval") {
    if (!msg.content.startsWith(prefix)) return;
    if(msg.author.id !== ayarlar.sahip) return
  if (!args[0] || args[0].includes('token')) return msg.channel.send("Kod belirtilmedi `" + prefix + this.help.name + "`__`<kod>`__")
  
	const code = args.join(' ');
	function clean(text) {
		if (typeof text !== 'string')
			text = require('util').inspect(text, { depth: 0 })
		text = text
			.replace(/`/g, '`' + String.fromCharCode(8203))
			.replace(/@/g, '@' + String.fromCharCode(8203))
		return text;
	};
    try {
		  var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace("token", "Yasaklı komut").replace(client.token, "Yasaklı komut").replace(process.env.PROJECT_INVITE_TOKEN, "Yasaklı komut");
		  msg.channel.send(`${evaled.replace(client.token, "Yasaklı komut").replace(process.env.PROJECT_INVITE_TOKEN, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { msg.channel.send(err, {code: "js", split: true}) }
  };
  if (command === "seviye") {
    if (!msg.content.startsWith(prefix)) return;
    let seviyesistemi = db.get(`seviyeozellik.${msg.guild.id}`);
    
    if (args[0] === "yardım") return msg.channel.send(new MessageEmbed().setColor(msg.member.displayHexColor).setTitle("Serendia Level").setFooter(msg.author.tag + " tarafından istendi!", msg.author.avatarURL({ dynamic: true, size: 2048 })).setDescription(`**s!seviye:** Seviye bilginizi gösterir.<a:danss:706229912364646421>\n**s!seviye sıralama:** Sunucudaki seviye sıralamasını gösterir.\n**s!seviye saydam:** Profilinizdeki saydamlığı ayarlarsınız. \`(5)\`\n**s!seviye renk:** Profilinizdeki rengi ayarlarsınız.\`(10)\`\n**s!seviye resim:** Profilinizdeki arkaplan resmini ayarlarsınız. \`(15)\`\n\nBu özellikleri hangi seviyelerde kullanabileceğiniz yanlarında yazmaktadır.`));
    if (args[0] && (args[0].includes('top') || args[0].includes('sıra'))) return msg.channel.send(new MessageEmbed().setColor(msg.member.displayHexColor).setTitle("Serendia Top Level 10").setFooter(msg.author.tag + " tarafından istendi!", msg.author.avatarURL({ dynamic: true, size: 2048 })).setDescription(msg.guild.members.cache.filter(uye => !uye.user.bot && db.get(`seviye.${msg.guild.id}.${uye.id}.lvl`)).array().sort((a, b) => Number(db.get(`seviye.${msg.guild.id}.${b.id}.lvl`))-Number(db.get(`seviye.${msg.guild.id}.${a.id}.lvl`))).slice(0, 10).map((uye, index) => (index+1)+"-) "+ (uye.toString() ? uye.toString() : uye.displayName) + " | " + db.get(`seviye.${msg.guild.id}.${uye.id}.lvl`)).join('\n')));
    
    if (args[0] === "aç") {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      if (seviyesistemi)
        return msg.channel.send(`Seviye Sistemi zaten sunucuda aktif durumda!`);
      if (!msg.member.hasPermission("ADMINISTRATOR"))
        return msg.channel.send(
          "Seviye sistemini sunucuda aktif edebilmek için **YÖNETİCİ** yetkisine sahip olmalısın!"
        );
      db.set(`seviyeozellik.${msg.guild.id}`, true);
      msg.channel.send(`Seviye Sistemi sunucuda başarıyla aktifleştirildi!`);
      return;
    }

    if (args[0] === "kapat") {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      if (!seviyesistemi)
        return msg.channel.send(
          `Seviye Sistemi zaten sunucuda devre dışı durumda!`
        );
      if (!msg.member.hasPermission("ADMINISTRATOR"))
        return msg.channel.send(
          "Seviye sistemini sunucuda devre dışı bırakabilmek için **YÖNETİCİ** yetkisine sahip olmalısın!"
        );
      db.delete(`seviyeozellik.${msg.guild.id}`);
      msg.channel.send(
        `Seviye Sistemi sunucuda başarıyla devre dışı bırakıldı!`
      );
      return;
    }

    if (args[0] === "sıfırla") {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      if (args[1] === "ödül") {
        db.delete(`seviye.${gid}.rolOdul`);
        msg.reply('Rol ödülleri başarıyla sıfırlandı!');
        return;
      }
      db.delete(`seviye.${gid}`);
      msg.channel.send(`Seviye Sistemi sunucuda başarıyla sıfırlandı!`);
      return;
    }
    
    if (logargs.includes(args[0])) {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      let knl = msg.mentions.channels.first();
      if (!knl) return msg.reply('Geçerli bir kanal etiketlemelisin!');
      db.set(`seviye.${msg.guild.id}.logKanali`, knl.id);
      msg.reply(`Log kanalı başarıyla ${knl} olarak ayarlandı!`);
      return
    }
    

    if (!seviyesistemi)
      return msg.channel.send(
        ` Seviye Sistemi sunucuda devre dışı durumda olduğu için seviye komutları çalışmamaktadır! Seviye sistemini aktif etmek için  \`${prefix}seviye aç\``
      );

    if (ark.includes(args[0])) {
      if (db.get(`seviye.${msg.guild.id}.${msg.author.id}.lvl`) < 10) return msg.reply('Bu komutu kullanabilmek için **10** seviye ve üstü olmalısın!');
      if (reset.includes(args[1])) {
        if (!db.has(`profil.${msg.author.id}.renk`))
          return msg.reply("Renk değiştirilmediği için sıfırlanamaz!");
        db.delete(`profil.${msg.author.id}.renk`);
        return;
        msg.reply("Renk başarıyla sıfırlandı!");
      }
      if (!args[1])
        return msg.reply(
          "Bir renk kodu veya `sıfırla` yazmalısın! (Başına # koymamalısın)"
        );
      if (args[1].length !== 6)
        return msg.reply("Geçerli bir renk kodu girmelisin! (6 haneli)");

      db.set(`profil.${msg.author.id}.renk`, args[1]);

      var Canvas = require("canvas");
      var canvas = Canvas.createCanvas(150, 150);
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = `#${args[1]}`;
      ctx.fill();
      ctx.fillRect(0, 0, 150, 150);
      const embed = new MessageEmbed()
        .setAuthor(
          "Ayarlanan Renk: #{renk}".replace("{renk}", args[1].toUpperCase())
        )
        .setImage(`attachment://renk.png`)
        .setColor("RANDOM");
      msg.channel.send({
        embed,
        files: [{ attachment: canvas.toBuffer(), name: "renk.png" }]
      });
      return;
    }
    if (arm.includes(args[0])) {
      if (db.get(`seviye.${msg.guild.id}.${msg.author.id}.lvl`) < 15) return msg.reply('Bu komutu kullanabilmek için **15** seviye ve üstü olmalısın!');
      if (reset.includes(args[1])) {
        if (!db.has(`profil.${msg.author.id}.resim`))
          return msg.reply("Resim zaten ayarlanmamış!");
        db.delete(`profil.${msg.author.id}.resim`);
        return msg.reply("Resim başarıyla sıfırlandı!");
      }
      if (!args[1] || !args[1].startsWith("http"))
        return msg.reply(
          "Ayarlamak istediğiniz resmin linkini veya `sıfırla` yazınız! (NOT: Resim linki http veya https ile başlamalı!)"
        );
      db.set(`profil.${msg.author.id}.resim`, args[1]);
      return msg.reply("Resim başarıyla ayarlandı!");
    }
    
    if (gecersizargs.includes(args[0])) {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      let hedef;
      let kullanici = msg.mentions.members.first() || msg.guild.members.cache.get(args[1]);
      let rol = msg.mentions.roles.first() || msg.guild.roles.cache.get(args[1]) || msg.guild.roles.cache.find(a => a.name === args.slice(1).join(' '));
      let kanal = msg.mentions.channels.first();
      if (kullanici) hedef = kullanici;
      if (rol) hedef = rol;
      if (kanal) hedef = kanal;
      let gecersizler = db.get(`seviye.${msg.guild.id}.gecersizler`) ? db.get(`seviye.${msg.guild.id}.gecersizler`) : [];
      if (!hedef) return msg.channel.send(new MessageEmbed().setDescription("Geçerli bir hedef belirtmelisin! (kişi/rol/kanal)").setColor(msg.member.displayHexColor).addField(`Geçersizler`, gecersizler.length > 0 ? gecersizler.map(id => (msg.guild.members.cache.get(id.slice(1)) || msg.guild.roles.cache.get(id.slice(1)) || msg.guild.channels.cache.get(id.slice(1))) ? (msg.guild.members.cache.get(id.slice(1)) || msg.guild.roles.cache.get(id.slice(1)) || msg.guild.channels.cache.get(id.slice(1))) : db.set(`seviye.${msg.guild.id}.gecersizler`, db.get(`seviye.${msg.guild.id}.gecersizler`).filter(a => a !== id))).join(', ') : "Bulunamadı!"));
      if (gecersizler.length > 0 && gecersizler.some(id => hedef.id === id.slice(1))) {
        gecersizler = gecersizler.filter(id => hedef.id !== id.slice(1));
        db.set(`seviye.${msg.guild.id}.gecersizler`, gecersizler);
        msg.channel.send(new MessageEmbed().setDescription(`${hedef} başarıyla cezalı listesinden kaldırıldı! Artık seviye sistemine dahil.`));
      } else {
        db.push(`seviye.${msg.guild.id}.gecersizler`, `c${hedef.id}`);
        msg.channel.send(new MessageEmbed().setDescription(`${hedef} başarıyla cezalı listesine eklendi! Artık seviye sistemine dahil değil.`));
      };
      return;
    }

    if (award.includes(args[0])) {
      if (msg.author.id !== msg.guild.owner.id && msg.author.id !== ayarlar.sahip)
        return msg.reply("Bu komut sunucu sahibine özeldir!");
      if (args[1] && args[1].includes('tür')) {
        await db.set(`seviye.${msg.guild.id}.rolOdulTur`, !db.get(`seviye.${msg.guild.id}.rolOdulTur`));
        msg.reply(`Rol ödül türü başarıyla ${db.get(`seviye.${msg.guild.id}.rolOdulTur`) ? "silmeli (önceki rolü almalı)" : "eklemeli"} olarak ayarlandı!`);
        return;
      };
      let user = msg.author;
      let role =
        msg.mentions.roles.first() || msg.guild.roles.cache.get(args[2]);
      if (!role)
        return msg.reply(
          `Bir ödül rolü belirtmelisiniz! \n**Doğru Kullanım:**  \`${prefix}seviye ödül tür (al/ekle)/<seviye> <@rol veya rol ID>\``
        );
      let lvl = args[1];
      if (!lvl)
        return msg.reply(
          `Ödül rolünün verileceği seviyeyi belirtmelisiniz! \n**Doğru Kullanım:**  \`${prefix}seviye ödül (al/ekle)/<seviye> <@rol veya rol ID>\``
        );
      if (isNaN(parseInt(lvl)))
        return msg.reply(
          `Lütfen geçerli bir seviye belirtin! \n**Doğru Kullanım:**  \`${prefix}seviye ödül (al/ekle)/<seviye> <@rol veya rol ID>\``
        );
      let id = user.id;
      let gid = msg.guild.id;
      let lvlRol = db.get(`seviye.${gid}.rolOdul.lvl${lvl}`) ? db.get(`seviye.${gid}.rolOdul.lvl${lvl}`) : [];
      if (lvlRol.some(x => x.includes(`${role.id}`))) {
        lvlRol = lvlRol.filter(x => !x.includes(`${role.id}`));
        db.set(`seviye.${gid}.rolOdul.lvl${lvl}`, lvlRol);
        msg.channel.send(`\`${role.name}\` rolü başarıyla **${lvl}** seviye ödülleri arasından kaldırıldı!`); 
      } else {
        await db.push(`seviye.${gid}.rolOdul.lvl${lvl}`, `r${role.id}`);
        msg.channel.send(
          `Başarılı! **${lvl}.seviye** ödülleri; ${db
            .get(`seviye.${gid}.rolOdul.lvl${lvl}`)
            .map(r =>
              msg.guild.roles.cache.has(r.slice(1))
                ? msg.guild.roles.cache.get(r.slice(1))
                : db.set(
                    `seviye.${gid}.rolOdul.lvl${lvl}`,
                    db.get(`seviye.${gid}.rolOdul.lvl${lvl}`).filter(x => x !== r)
                  )
            )}`
        );
      }
      return;
    }

    let u = msg.mentions.users.first() || msg.author;
    if (u.bot) return msg.reply("Botların seviyesi olamaz!");

    var g = "95";

    var Canvas = require("canvas");
    var canvas = Canvas.createCanvas(750, 300);
    var ctx = canvas.getContext("2d");
    const avatarURL = u.avatarURL({ format: 'png', dynamic: true, size: 1024 });
    const { body } = await request.get(avatarURL);
    const avatar = await Canvas.loadImage(body);
    if (db.has(`profil.${u.id}.resim`)) {
      const rs = await request.get(db.get(`profil.${u.id}.resim`));
      const resim = await Canvas.loadImage(rs.body);
      ctx.drawImage(resim, 0, 0, 750, 300);

      var g = "55";
    }

    if (saydam.includes(args[0])) {
      if (db.get(`seviye.${msg.guild.id}.${msg.author.id}.lvl`) < 5) return msg.reply('Bu komutu kullanabilmek için **5** seviye ve üstü olmalısın!');
      if (reset.includes(args[1])) {
        if (!db.has(`profil.${msg.author.id}.saydam`))
          return msg.reply("Saydamlık zaten standart halinde!");
        db.delete(`profil.${msg.author.id}.saydam`);
        return msg.reply("Saydamlık başarıyla sıfırlandı!");
      }
      if (
        !args[1] ||
        isNaN(args[1] || Number(args[1]) > 5 || Number(args[1]) < 1)
      )
        return msg.reply(
          "Ayarlamak istediğiniz dereceyi veya `sıfırla` yazınız! \n**Dereceler:** `1`, `2`, `3`, `4`, `5`"
        );

      db.set(`profil.${msg.author.id}.saydam`, args[1]);
      return msg.reply("Siyah katmanın saydamlığı başarıyla değiştirildi!");
    }

    if (db.has(`profil.${msg.author.id}.saydam`) === true) {
      if (db.get(`profil.${msg.author.id}.saydam`) === "1") {
        var g = "40";
      }

      if (db.get(`profil.${msg.author.id}.saydam`) === "2") {
        var g = "30";
      }

      if (db.get(`profil.${msg.author.id}.saydam`) === "3") {
        var g = "20";
      }

      if (db.get(`profil.${msg.author.id}.saydam`) === "4") {
        var g = "10";
      }

      if (db.get(`profil.${msg.author.id}.saydam`) === "5") {
        var g = "0";
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0." + g + ")";
    ctx.fill();
    ctx.fillRect(25, 20, 700, 260);

    ctx.fillStyle = "rgba(0, 0, 0, 0.30)";
    ctx.fill();
    ctx.fillRect(0, 0, 750, 300);

    var re = db.get(`profil.${u.id}.renk`) || "FF0000";

    let user = msg.mentions.users.first() || msg.author;
    let id = user.id;
    let gid = msg.guild.id;

    let xp = db.get(`seviye.${gid}.${id}.xp`); // xp_${id}_${gid}
    let lvl = db.get(`seviye.${gid}.${id}.lvl`); // lvl_${id}_${gid}
    let xpToLvl = db.get(`seviye.${gid}.${id}.xpToLvl`); // xpToLvl_${id}_${gid}
    let msgs = db.get(`seviye.${gid}.${id}.msgs`); // msgs_${id}_${gid}
    
    // 50000 - 600 ((100 / 1800) / 100 = 0,18)
    
    let sira = "";
    const sorted = msg.guild.members.cache
      .filter(u => !u.user.bot && db.get(`seviye.${gid}.${u.id}.lvl`))
      .array()
      .sort((a, b) => Number(db.get(`seviye.${gid}.${b.id}.lvl`))-Number(db.get(`seviye.${gid}.${a.id}.lvl`)));
    const top10 = sorted.splice(0, msg.guild.members.cache.size);
    const mappedID = top10.map(s => s.user.id);
    for (var i = 0; i < msg.guild.members.cache.size; i++) {
      if (mappedID[i] === u.id) {
        sira += `${i + 1}`;
      }
    }

        var de = ((xp/xpToLvl));
        ctx.beginPath();
        ctx.fillStyle = "#999999";
        ctx.arc(
          257 + 18.5,
          147.5 + 18.5 + 36.25,
          18.5,
          1.5 * Math.PI,
          0.5 * Math.PI,
          true
        );
        ctx.fill();
        ctx.fillRect(257 + 18.5, 147.5 + 36.15, 250 * 1.6, 37.5);
        ctx.arc(
          257 + 18.5 + 250 * 1.6,
          147.5 + 18.5 + 36.25,
          18.75,
          1.5 * Math.PI,
          0.5 * Math.PI,
          false
        );
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `#${re}`;
        ctx.arc(
          257 + 18.5,
          147.5 + 18.5 + 36.25,
          18.5,
          1.5 * Math.PI,
          0.5 * Math.PI,
          true
        );
        ctx.fill();
        ctx.fillRect(257 + 18.5, 147.5 + 36.25, de * 400, 37.5); // 0.8-0.9
        ctx.arc(
          257 + 18.5 + de * 400,
          147.5 + 18.5 + 36.25,
          18.75,
          1.5 * Math.PI,
          0.5 * Math.PI,
          false
        );
        ctx.fill();
        ctx.fillStyle = `#${re}`;
        ctx.font = "28px Impact";
        ctx.textAlign = "right";
        ctx.fillText(`Sıralama #${sira} | Seviye ${lvl ? lvl : 0}`, 670, 70);
        ctx.font = "20px Impact";
        ctx.textAlign = "right";
        ctx.fillText(`${xp ? xp : 0} / ${xp ? xpToLvl : "0"} XP`, 670, 100);
        ctx.fillStyle = `#bfbfbf`;
        ctx.font = "28px Impact";
        ctx.textAlign = "left";
        ctx.fillText(`${u.tag}`, 270, 150);
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.arc(55 + 80, 80 + 80, 80, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.drawImage(avatar, 55, 80, 160, 160);

    msg.channel.send({
      files: [{ attachment: canvas.toBuffer(), name: "seviye.png" }]
    });
    client.seviyeYokla(msg.guild.id, user.id);
    return;
  };

  let seviyesistemi = db.get(`seviyeozellik.${msg.guild.id}`);
  if (!seviyesistemi) return;

  let id = msg.author.id;
  let gid = msg.guild.id;
  let msgs = db.get(`seviye.${gid}.${id}.msgs`);
  let xp = db.get(`seviye.${gid}.${id}.xp`);
  let lvl = db.get(`seviye.${gid}.${id}.lvl`);
  let xpToLvl = db.get(`seviye.${gid}.${id}.xpToLvl`);

  await db.add(`seviye.${gid}.${id}.msgs`, 1);

  if (!lvl) {
    db.set(`seviye.${gid}.${id}.xp`, 5);
    db.set(`seviye.${gid}.${id}.lvl`, 1);
    db.set(`seviye.${gid}.${id}.xpToLvl`, 100);
  } else {
    var random = Math.random() * (5 - 2) + 2;
    await db.add(`seviye.${gid}.${id}.xp`, random.toFixed());

    if (
      db.get(`seviye.${gid}.${id}.xp`) > db.get(`seviye.${gid}.${id}.xpToLvl`)
    ) {
      await db.add(`seviye.${gid}.${id}.lvl`, 1);
      await db.add(`seviye.${gid}.${id}.xpToLvl`, -xp);
      await db.add(
        `seviye.${gid}.${id}.xpToLvl`,
        db.get(`seviye.${gid}.${id}.lvl`) * 100
      );
      db.set(`seviye.${gid}.${id}.xp`, 1);
      let lvl = db.get(`seviye.${gid}.${id}.lvl`);
      if (client.channels.cache.has(db.get(`seviye.${gid}.logKanali`))) msg.guild.channels.cache.get(db.get(`seviye.${gid}.logKanali`)).send(`${msg.author} tebrikler, seviye atladın! Yeni seviyen: **${lvl}**`)
      else msg.reply(`tebrikler, seviye atladın! Yeni seviyen: **${lvl}**`).then(a => a.delete({ timeout: 5000 }));
      client.seviyeYokla(msg.guild.id, msg.author.id);
      let odulVeri = db.get(`seviye.${gid}.rolOdul.lvl${lvl}`);
      if (!odulVeri) return;
      let roles = odulVeri
        .filter(r => msg.guild.roles.cache.has(r.slice(1)))
        .map(r => r.slice(1));
      if (!roles) return;
      else {
        msg.member.roles.add(roles);
        if (client.channels.cache.has(db.get(`seviye.${gid}.logKanali`))) msg.guild.channels.cache.get(db.get(`seviye.${gid}.logKanali`)).send(`${msg.author} tebrikler! **${lvl}.seviye**ye gelerek  \`${roles.map(r => msg.guild.roles.cache.get(r).name).join(", ")}\`  rol(leri) kazandın.`)
        else msg.channel.send(`${msg.author} tebrikler! **${lvl}.seviye**ye gelerek  \`${roles.map(r => msg.guild.roles.cache.get(r).name).join(", ")}\`  rol(leri) kazandın.`);
      }
    }
  }
});

client.login(ayarlar.token);