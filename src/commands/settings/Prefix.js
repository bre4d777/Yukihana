


import { Command } from '#structures/Command.js';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '#database/DatabaseManager.js';
import { config } from '#config/config.js';



class PrefixCommand extends Command {
  constructor() {
    super({
      name: 'prefix',
      description: 'View or change the bot prefix for this server',
      usage: 'prefix [new prefix]',
      aliases: ['setprefix'],
      category: 'settings',
      cooldown: 10,
      permissions: [PermissionFlagsBits.SendMessages],
      enabledSlash: true,
      slashData: {
        name: ['settings', 'prefix'],
        description: 'View or change the bot prefix for this server',
        options: [{
          name: 'newprefix',
          description: 'The new prefix to set (max 5 characters)',
          type: 3,
          required: false,
          max_length: 5
        }]
      }
    });
  }



  async execute({ message, args, prefix }) {



    if (args.length === 0) {

      const embed = new EmbedBuilder()

        .setColor('#3498db')

        .setTitle('Server Prefix')

        .setDescription(`Current prefix for this server: \`${prefix}\``)

        .addFields(

          { name: 'Usage', value: `To change it: \`${prefix}prefix <new prefix>\`` },

          { name: 'Default Prefix', value: `The default prefix is: \`${config.prefix}\`` }

        )

        .setFooter({ text: 'Note: Only server admins can change the prefix' })

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }



    if (!message.member.permissions.has(PermissionFlagsBits.Administrator) &&

        !config.ownerIds.includes(message.author.id)) {

      const embed = new EmbedBuilder()

        .setColor('#e74c3c')

        .setTitle('Permission Denied')

        .setDescription('Only server administrators can change the bot prefix.')

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }



    const newPrefix = args[0];



    if (newPrefix.length > 5) {

      const embed = new EmbedBuilder()

        .setColor('#e74c3c')

        .setTitle('Error')

        .setDescription('Prefix is too long. Maximum 5 characters allowed.')

        .setTimestamp();

      return message.channel.send({ embeds: [embed] });

    }



    db.setPrefix(message.guild.id, newPrefix);



    const embed = new EmbedBuilder()

      .setColor('#2ecc71')

      .setTitle('Prefix Updated')

      .setDescription(`Server prefix has been updated to \`${newPrefix}\``)

      .addFields(

        { name: 'Example', value: `Use commands with: \`${newPrefix}help\`` }

      )

      .setFooter({ text: 'All members will need to use this new prefix' })

      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }

  async slashExecute({ interaction, client }) {
    const newPrefix = interaction.options.getString('newprefix');
    const prefix = db.getPrefix(interaction.guild.id);
    
    if (!newPrefix) {
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('Server Prefix')
        .setDescription(`Current prefix for this server: \`${prefix}\``)
        .addFields(
          { name: 'Usage', value: `To change it: \`/prefix newprefix:<new prefix>\`` },
          { name: 'Default Prefix', value: `The default prefix is: \`${config.prefix}\`` }
        )
        .setFooter({ text: 'Note: Only server admins can change the prefix' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
        !config.ownerIds.includes(interaction.user.id)) {
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('Permission Denied')
        .setDescription('Only server administrators can change the bot prefix.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (newPrefix.length > 5) {
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('Error')
        .setDescription('Prefix is too long. Maximum 5 characters allowed.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    db.setPrefix(interaction.guild.id, newPrefix);

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('Prefix Updated')
      .setDescription(`Server prefix has been updated to \`${newPrefix}\``)
      .addFields(
        { name: 'Example', value: `Use commands with: \`${newPrefix}help\`` }
      )
      .setFooter({ text: 'All members will need to use this new prefix' })
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
}

export default new PrefixCommand();
