using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAvatarObjectKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "avatar_object_key",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "avatar_object_key",
                table: "users");
        }
    }
}
