import { BelongsToMany, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";

interface FilesCreationAttrs {
  essenceTable?: string;
  essenceId?: number;
  filePath: string;
}

@Table({ tableName: 'files' })
export class Files extends Model<Files, FilesCreationAttrs> {
  
  @Column({type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true})
  id: number;

  @Column
  essenceTable: string

  @Column
  essenceId: number;

  @Column
  filePath: string;
}