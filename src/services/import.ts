import Papa from 'papaparse';
import { AmbitionsService } from '@/services/db/ambitions';
import { QuarterlyObjectivesService } from '@/services/db/quarterlyObjectives';
import { QuarterlyKeyResultsService } from '@/services/db/quarterlyKeyResults';
import { ActionsService } from '@/services/db/actions';
import {
  type Ambition,
  type QuarterlyObjective,
  type QuarterlyKeyResult,
  type Action,
  AmbitionCategory,
  Priority,
  Status,
  ActionStatus,
  Quarter,
} from '@/types';

// Types pour le mapping CSV
export interface CSVRow {
  [key: string]: string;
}

export interface ImportResult {
  success: boolean;
  ambitionsCreated: number;
  objectivesCreated: number;
  keyResultsCreated: number;
  actionsCreated: number;
  errors: string[];
}

export interface ColumnMapping {
  // Ambition
  ambitionTitle?: string;
  ambitionDescription?: string;
  ambitionCategory?: string;
  ambitionPriority?: string;
  ambitionYear?: string;
  
  // Quarterly Objective
  objectiveTitle?: string;
  objectiveDescription?: string;
  objectiveQuarter?: string;
  objectiveYear?: string;
  
  // Quarterly Key Result
  krTitle?: string;
  krDescription?: string;
  krTarget?: string;
  krCurrent?: string;
  krUnit?: string;
  krDeadline?: string;
  
  // Action
  actionTitle?: string;
  actionDescription?: string;
  actionPriority?: string;
  actionDeadline?: string;
  actionLabels?: string;
}

class ImportService {
  // Parse CSV file
  public parseCSV(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as CSVRow[]);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  // Auto-detect column mapping
  public autoDetectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    
    headers.forEach(header => {
      const lower = header.toLowerCase().trim();
      
      // Ambition
      if (lower.includes('ambition') && (lower.includes('titre') || lower.includes('title'))) {
        mapping.ambitionTitle = header;
      } else if (lower.includes('ambition') && (lower.includes('desc') || lower.includes('description'))) {
        mapping.ambitionDescription = header;
      } else if (lower.includes('ambition') && (lower.includes('cat') || lower.includes('category'))) {
        mapping.ambitionCategory = header;
      } else if (lower.includes('ambition') && (lower.includes('prior') || lower.includes('priority'))) {
        mapping.ambitionPriority = header;
      } else if (lower.includes('ambition') && (lower.includes('ann') || lower.includes('year'))) {
        mapping.ambitionYear = header;
      }
      
      // Quarterly Objective
      else if (lower.includes('objectif') && (lower.includes('titre') || lower.includes('title'))) {
        mapping.objectiveTitle = header;
      } else if (lower.includes('objectif') && (lower.includes('desc') || lower.includes('description'))) {
        mapping.objectiveDescription = header;
      } else if (lower.includes('objectif') && (lower.includes('trim') || lower.includes('quarter'))) {
        mapping.objectiveQuarter = header;
      } else if (lower.includes('objectif') && (lower.includes('ann') || lower.includes('year'))) {
        mapping.objectiveYear = header;
      }
      
      // Key Result
      else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('titre') || lower.includes('title'))) {
        mapping.krTitle = header;
      } else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('desc') || lower.includes('description'))) {
        mapping.krDescription = header;
      } else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('cible') || lower.includes('target'))) {
        mapping.krTarget = header;
      } else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('actuel') || lower.includes('current'))) {
        mapping.krCurrent = header;
      } else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('unit') || lower.includes('unité'))) {
        mapping.krUnit = header;
      } else if ((lower.includes('kr') || lower.includes('key result')) && (lower.includes('deadline') || lower.includes('échéance'))) {
        mapping.krDeadline = header;
      }
      
      // Action
      else if (lower.includes('action') && (lower.includes('titre') || lower.includes('title'))) {
        mapping.actionTitle = header;
      } else if (lower.includes('action') && (lower.includes('desc') || lower.includes('description'))) {
        mapping.actionDescription = header;
      } else if (lower.includes('action') && (lower.includes('prior') || lower.includes('priority'))) {
        mapping.actionPriority = header;
      } else if (lower.includes('action') && (lower.includes('deadline') || lower.includes('échéance'))) {
        mapping.actionDeadline = header;
      } else if (lower.includes('action') && (lower.includes('label') || lower.includes('tag'))) {
        mapping.actionLabels = header;
      }
    });
    
    return mapping;
  }

  // Import data with mapping
  public async importData(
    rows: CSVRow[],
    mapping: ColumnMapping,
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      ambitionsCreated: 0,
      objectivesCreated: 0,
      keyResultsCreated: 0,
      actionsCreated: 0,
      errors: [],
    };

    const ambitionMap = new Map<string, string>(); // title -> id
    const objectiveMap = new Map<string, string>(); // title -> id
    const krMap = new Map<string, string>(); // title -> id

    try {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        try {
          // Create Ambition if data present
          if (mapping.ambitionTitle && row[mapping.ambitionTitle]?.trim()) {
            const title = row[mapping.ambitionTitle].trim();
            
            if (!ambitionMap.has(title)) {
              const ambition: Partial<Ambition> = {
                title,
                description: mapping.ambitionDescription ? row[mapping.ambitionDescription]?.trim() || '' : '',
                year: mapping.ambitionYear ? parseInt(row[mapping.ambitionYear]) || new Date().getFullYear() : new Date().getFullYear(),
                category: this.parseCategory(mapping.ambitionCategory ? row[mapping.ambitionCategory] : ''),
                priority: this.parsePriority(mapping.ambitionPriority ? row[mapping.ambitionPriority] : ''),
                status: Status.ACTIVE,
              };
              const created = await AmbitionsService.create(ambition, userId);
              ambitionMap.set(title, created.id);
              result.ambitionsCreated++;
            }
          }

          // Create Quarterly Objective if data present
          if (mapping.objectiveTitle && row[mapping.objectiveTitle]?.trim()) {
            const title = row[mapping.objectiveTitle].trim();
            
            if (!objectiveMap.has(title)) {
              // Find parent ambition
              const ambitionTitle = mapping.ambitionTitle ? row[mapping.ambitionTitle]?.trim() : '';
              const ambitionId = ambitionTitle ? ambitionMap.get(ambitionTitle) || '' : '';
              
              const objective: Partial<QuarterlyObjective> = {
                title,
                description: mapping.objectiveDescription ? row[mapping.objectiveDescription]?.trim() || '' : '',
                ambitionId,
                quarter: this.parseQuarter(mapping.objectiveQuarter ? row[mapping.objectiveQuarter] : ''),
                year: mapping.objectiveYear ? parseInt(row[mapping.objectiveYear]) || new Date().getFullYear() : new Date().getFullYear(),
                status: Status.ACTIVE,
              };
              const created = await QuarterlyObjectivesService.create(objective, userId);
              objectiveMap.set(title, created.id);
              result.objectivesCreated++;
            }
          }

          // Create Quarterly Key Result if data present
          if (mapping.krTitle && row[mapping.krTitle]?.trim()) {
            const title = row[mapping.krTitle].trim();
            
            if (!krMap.has(title)) {
              // Find parent objective
              const objectiveTitle = mapping.objectiveTitle ? row[mapping.objectiveTitle]?.trim() : '';
              const quarterlyObjectiveId = objectiveTitle ? objectiveMap.get(objectiveTitle) || '' : '';
              
              const kr: Partial<QuarterlyKeyResult> = {
                title,
                description: mapping.krDescription ? row[mapping.krDescription]?.trim() || '' : '',
                quarterlyObjectiveId,
                target: mapping.krTarget ? parseFloat(row[mapping.krTarget]) || 100 : 100,
                current: mapping.krCurrent ? parseFloat(row[mapping.krCurrent]) || 0 : 0,
                unit: mapping.krUnit ? row[mapping.krUnit]?.trim() || 'unités' : 'unités',
                deadline: mapping.krDeadline ? new Date(row[mapping.krDeadline]) : new Date(new Date().setMonth(new Date().getMonth() + 3)),
                status: Status.ACTIVE,
              };
              const created = await QuarterlyKeyResultsService.create(kr);
              krMap.set(title, created.id);
              result.keyResultsCreated++;
            }
          }

          // Create Action if data present
          if (mapping.actionTitle && row[mapping.actionTitle]?.trim()) {
            // Find parent KR
            const krTitle = mapping.krTitle ? row[mapping.krTitle]?.trim() : '';
            const quarterlyKeyResultId = krTitle ? krMap.get(krTitle) || '' : '';
            
            const action: Partial<Action> = {
              title: row[mapping.actionTitle].trim(),
              description: mapping.actionDescription ? row[mapping.actionDescription]?.trim() : undefined,
              quarterlyKeyResultId,
              status: ActionStatus.TODO,
              priority: this.parsePriority(mapping.actionPriority ? row[mapping.actionPriority] : ''),
              labels: mapping.actionLabels ? row[mapping.actionLabels]?.split(',').map(l => l.trim()).filter(l => l) || [] : [],
              deadline: mapping.actionDeadline && row[mapping.actionDeadline] ? new Date(row[mapping.actionDeadline]) : undefined,
              order_index: 0,
            };
            await ActionsService.create(action, userId);
            result.actionsCreated++;
          }
        } catch (error) {
          result.errors.push(`Ligne ${index + 2}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Erreur globale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }

    return result;
  }

  // Helper: parse category
  private parseCategory(value: string): AmbitionCategory {
    const lower = value?.toLowerCase().trim() || '';
    if (lower.includes('revenue') || lower.includes('ca') || lower.includes('chiffre')) return AmbitionCategory.REVENUE;
    if (lower.includes('growth') || lower.includes('croissance')) return AmbitionCategory.GROWTH;
    if (lower.includes('product') || lower.includes('produit')) return AmbitionCategory.PRODUCT;
    if (lower.includes('team') || lower.includes('équipe')) return AmbitionCategory.TEAM;
    if (lower.includes('market') || lower.includes('marché')) return AmbitionCategory.MARKET;
    if (lower.includes('operational') || lower.includes('opération')) return AmbitionCategory.OPERATIONAL;
    if (lower.includes('personal') || lower.includes('personnel')) return AmbitionCategory.PERSONAL;
    return AmbitionCategory.GROWTH;
  }

  // Helper: parse priority
  private parsePriority(value: string): Priority {
    const lower = value?.toLowerCase().trim() || '';
    if (lower.includes('critical') || lower.includes('critique')) return Priority.CRITICAL;
    if (lower.includes('high') || lower.includes('élevé') || lower.includes('haute')) return Priority.HIGH;
    if (lower.includes('low') || lower.includes('faible') || lower.includes('basse')) return Priority.LOW;
    return Priority.MEDIUM;
  }

  // Helper: parse quarter
  private parseQuarter(value: string): Quarter {
    const lower = value?.toLowerCase().trim() || '';
    if (lower.includes('q1') || lower.includes('t1') || lower.includes('1')) return Quarter.Q1;
    if (lower.includes('q2') || lower.includes('t2') || lower.includes('2')) return Quarter.Q2;
    if (lower.includes('q3') || lower.includes('t3') || lower.includes('3')) return Quarter.Q3;
    if (lower.includes('q4') || lower.includes('t4') || lower.includes('4')) return Quarter.Q4;
    return Quarter.Q1;
  }
}

export const importService = new ImportService();

