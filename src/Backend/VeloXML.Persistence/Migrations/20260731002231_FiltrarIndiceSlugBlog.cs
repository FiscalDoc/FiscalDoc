using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeloXML.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FiltrarIndiceSlugBlog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_blog_posts_slug",
                table: "blog_posts");

            migrationBuilder.DropIndex(
                name: "ix_blog_categorias_slug",
                table: "blog_categorias");

            migrationBuilder.CreateIndex(
                name: "ix_blog_posts_slug",
                table: "blog_posts",
                column: "slug",
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_blog_categorias_slug",
                table: "blog_categorias",
                column: "slug",
                unique: true,
                filter: "deleted_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_blog_posts_slug",
                table: "blog_posts");

            migrationBuilder.DropIndex(
                name: "ix_blog_categorias_slug",
                table: "blog_categorias");

            migrationBuilder.CreateIndex(
                name: "ix_blog_posts_slug",
                table: "blog_posts",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_blog_categorias_slug",
                table: "blog_categorias",
                column: "slug",
                unique: true);
        }
    }
}
